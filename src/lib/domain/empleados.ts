"use server";

import { createClient } from "@/lib/supabase/server";

export interface Employee {
  userId: number;
  empleadoId: number | null;
  name: string;
  role: string;
  email: string;
  active: boolean;
  specialty: string | null;
  activeOrders?: number;
}

export interface Mechanic {
  empleadoId: number;
  name: string;
}

interface UsuarioConRolYEmpleado {
  id_usuario: number;
  nombre_completo: string;
  correo: string | null;
  activo: boolean;
  rol: { nombre_rol: string } | null;
  empleado: { id_empleado: number; especialidad: string | null }[] | { id_empleado: number; especialidad: string | null } | null;
}

function empleadoDe(row: UsuarioConRolYEmpleado) {
  return Array.isArray(row.empleado) ? row.empleado[0] ?? null : row.empleado;
}

/** Todo el personal del taller (todos los roles menos Administrador), para la vista de solo lectura de la Supervisora. */
export async function listEmpleados(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuario")
    .select("id_usuario, nombre_completo, correo, activo, rol:id_rol(nombre_rol), empleado(id_empleado, especialidad)")
    .order("nombre_completo");
  if (error) throw new Error(error.message);

  const rows = (data as unknown as UsuarioConRolYEmpleado[]).filter((r) => r.rol?.nombre_rol && r.rol.nombre_rol !== "Administrador");

  const mecanicoIds = rows
    .filter((r) => r.rol?.nombre_rol === "Mecánico")
    .map((r) => empleadoDe(r)?.id_empleado)
    .filter((id): id is number => id != null);

  const activeOrdersByEmpleado = new Map<number, number>();
  if (mecanicoIds.length > 0) {
    const { data: ordenes } = await supabase
      .from("orden_servicio")
      .select("id_empleado, estado_orden:id_estado_orden(nombre_estado)")
      .in("id_empleado", mecanicoIds);
    for (const o of (ordenes ?? []) as unknown as { id_empleado: number; estado_orden: { nombre_estado: string } | null }[]) {
      const estado = o.estado_orden?.nombre_estado;
      if (estado === "Pendiente" || estado === "En Proceso") {
        activeOrdersByEmpleado.set(o.id_empleado, (activeOrdersByEmpleado.get(o.id_empleado) ?? 0) + 1);
      }
    }
  }

  return rows.map((r) => {
    const emp = empleadoDe(r);
    return {
      userId: r.id_usuario,
      empleadoId: emp?.id_empleado ?? null,
      name: r.nombre_completo,
      role: r.rol!.nombre_rol,
      email: r.correo ?? "",
      active: r.activo,
      specialty: emp?.especialidad ?? null,
      activeOrders: r.rol?.nombre_rol === "Mecánico" && emp ? activeOrdersByEmpleado.get(emp.id_empleado) ?? 0 : undefined,
    };
  });
}

/** Mecánicos activos con fila en `empleado`, para el selector de reasignación de la Supervisora. */
export async function listMecanicosActivos(): Promise<Mechanic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuario")
    .select("nombre_completo, activo, rol:id_rol(nombre_rol), empleado(id_empleado)")
    .eq("activo", true);
  if (error) throw new Error(error.message);

  return (data as unknown as UsuarioConRolYEmpleado[])
    .filter((r) => r.rol?.nombre_rol === "Mecánico" && empleadoDe(r) != null)
    .map((r) => ({ empleadoId: empleadoDe(r)!.id_empleado, name: r.nombre_completo }));
}
