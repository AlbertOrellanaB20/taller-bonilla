"use server";

import { createClient } from "@/lib/supabase/server";

function startOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export interface AdminDashboardStats {
  ingresosDelMes: number;
  ordenesActivas: number;
  vehiculosEnTaller: number;
  stockBajo: number;
  ingresosUltimos7Dias: { label: string; value: number }[];
  serviciosTopMes: { name: string; count: number }[];
  ordenesRecientes: { plate: string; model: string; client: string; mechanic: string; status: string; date: string }[];
  alertasInventario: { name: string; current: number; min: number }[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [facturasPagadasMes, facturas7dias, ordenesActivasRows, repuestos, detallesServicioMes, ordenesRecientesRows] = await Promise.all([
    supabase.from("factura").select("total, estado_factura:id_estado_factura(nombre_estado)").gte("fecha_emision", startOfMonth()),
    supabase.from("factura").select("total, fecha_emision, estado_factura:id_estado_factura(nombre_estado)").gte("fecha_emision", daysAgo(6)),
    supabase.from("orden_servicio").select("id_vehiculo, estado_orden:id_estado_orden(nombre_estado)"),
    supabase.from("repuesto").select("nombre, stock_actual, stock_minimo"),
    supabase
      .from("detalle_servicio")
      .select("servicio:id_servicio(nombre_servicio), orden_servicio:id_orden_servicio(fecha_ingreso)")
      .gte("orden_servicio.fecha_ingreso", startOfMonth()),
    supabase
      .from("orden_servicio")
      .select(
        "fecha_ingreso, vehiculo:id_vehiculo(placa, marca, modelo, cliente:id_cliente(nombre_completo)), empleado:id_empleado(usuario:id_usuario(nombre_completo)), estado_orden:id_estado_orden(nombre_estado)",
      )
      .order("id_orden_servicio", { ascending: false })
      .limit(5),
  ]);

  type FEstado = { total: number; estado_factura: { nombre_estado: string } | null };
  const ingresosDelMes = ((facturasPagadasMes.data ?? []) as unknown as FEstado[])
    .filter((f) => f.estado_factura?.nombre_estado === "Pagada")
    .reduce((a, f) => a + Number(f.total), 0);

  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const buckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const f of (facturas7dias.data ?? []) as unknown as (FEstado & { fecha_emision: string })[]) {
    if (f.estado_factura?.nombre_estado !== "Pagada") continue;
    const key = f.fecha_emision.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(f.total));
  }
  const ingresosUltimos7Dias = [...buckets.entries()].map(([iso, value]) => ({
    label: dayLabels[new Date(iso).getUTCDay()],
    value,
  }));

  type OrdenEstado = { id_vehiculo: number; estado_orden: { nombre_estado: string } | null };
  const activas = ((ordenesActivasRows.data ?? []) as unknown as OrdenEstado[]).filter(
    (o) => o.estado_orden?.nombre_estado === "Pendiente" || o.estado_orden?.nombre_estado === "En Proceso",
  );
  const ordenesActivas = activas.length;
  const vehiculosEnTaller = new Set(activas.map((o) => o.id_vehiculo)).size;

  type Repuesto = { nombre: string; stock_actual: number; stock_minimo: number };
  const bajos = ((repuestos.data ?? []) as Repuesto[]).filter((r) => r.stock_actual < r.stock_minimo);
  const stockBajo = bajos.length;
  const alertasInventario = bajos
    .sort((a, b) => a.stock_actual / Math.max(a.stock_minimo, 1) - b.stock_actual / Math.max(b.stock_minimo, 1))
    .slice(0, 4)
    .map((r) => ({ name: r.nombre, current: r.stock_actual, min: r.stock_minimo }));

  type DetalleServicioRow = { servicio: { nombre_servicio: string } | null; orden_servicio: { fecha_ingreso: string } | null };
  const conteoServicios = new Map<string, number>();
  for (const d of (detallesServicioMes.data ?? []) as unknown as DetalleServicioRow[]) {
    const nombre = d.servicio?.nombre_servicio;
    if (!nombre || !d.orden_servicio) continue;
    conteoServicios.set(nombre, (conteoServicios.get(nombre) ?? 0) + 1);
  }
  const serviciosTopMes = [...conteoServicios.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  type OrdenReciente = {
    fecha_ingreso: string;
    vehiculo: { placa: string; marca: string; modelo: string; cliente: { nombre_completo: string } | null } | null;
    empleado: { usuario: { nombre_completo: string } | null } | null;
    estado_orden: { nombre_estado: string } | null;
  };
  const ordenesRecientes = ((ordenesRecientesRows.data ?? []) as unknown as OrdenReciente[]).map((o) => ({
    plate: o.vehiculo?.placa ?? "—",
    model: `${o.vehiculo?.marca ?? ""} ${o.vehiculo?.modelo ?? ""}`.trim(),
    client: o.vehiculo?.cliente?.nombre_completo ?? "—",
    mechanic: o.empleado?.usuario?.nombre_completo ?? "Sin asignar",
    status: o.estado_orden?.nombre_estado ?? "Pendiente",
    date: o.fecha_ingreso.slice(0, 10).split("-").reverse().join("/"),
  }));

  return { ingresosDelMes, ordenesActivas, vehiculosEnTaller, stockBajo, ingresosUltimos7Dias, serviciosTopMes, ordenesRecientes, alertasInventario };
}

export interface SupervisoraReportes {
  serviciosTopMes: { name: string; count: number }[];
  tiempoPromedioPorServicio: { name: string; hours: number }[];
  desempenoPorMecanico: { name: string; completed: number }[];
}

export async function getSupervisoraReportes(): Promise<SupervisoraReportes> {
  const supabase = await createClient();

  const [detalles, ordenesTerminadas] = await Promise.all([
    supabase
      .from("detalle_servicio")
      .select("servicio:id_servicio(nombre_servicio), orden_servicio:id_orden_servicio(fecha_ingreso, fecha_entrega_real)")
      .gte("orden_servicio.fecha_ingreso", startOfMonth()),
    supabase
      .from("orden_servicio")
      .select("estado_orden:id_estado_orden(nombre_estado), empleado:id_empleado(usuario:id_usuario(nombre_completo))")
      .gte("fecha_ingreso", startOfMonth()),
  ]);

  type DetalleRow = { servicio: { nombre_servicio: string } | null; orden_servicio: { fecha_ingreso: string; fecha_entrega_real: string | null } | null };
  const rows = (detalles.data ?? []) as unknown as DetalleRow[];

  const conteo = new Map<string, number>();
  const horasPorServicio = new Map<string, number[]>();
  for (const d of rows) {
    const nombre = d.servicio?.nombre_servicio;
    if (!nombre || !d.orden_servicio) continue;
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
    if (d.orden_servicio.fecha_entrega_real) {
      const horas = (new Date(d.orden_servicio.fecha_entrega_real).getTime() - new Date(d.orden_servicio.fecha_ingreso).getTime()) / 3_600_000;
      if (horas >= 0) horasPorServicio.set(nombre, [...(horasPorServicio.get(nombre) ?? []), horas]);
    }
  }

  const serviciosTopMes = [...conteo.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  const tiempoPromedioPorServicio = [...horasPorServicio.entries()]
    .map(([name, valores]) => ({ name, hours: Math.round((valores.reduce((a, v) => a + v, 0) / valores.length) * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 7);

  type OrdenMecRow = { estado_orden: { nombre_estado: string } | null; empleado: { usuario: { nombre_completo: string } | null } | null };
  const conteoMecanico = new Map<string, number>();
  for (const o of (ordenesTerminadas.data ?? []) as unknown as OrdenMecRow[]) {
    const nombreEstado = o.estado_orden?.nombre_estado;
    const mecanico = o.empleado?.usuario?.nombre_completo;
    if (!mecanico || (nombreEstado !== "Finalizado" && nombreEstado !== "Entregado")) continue;
    conteoMecanico.set(mecanico, (conteoMecanico.get(mecanico) ?? 0) + 1);
  }
  const desempenoPorMecanico = [...conteoMecanico.entries()].map(([name, completed]) => ({ name, completed })).sort((a, b) => b.completed - a.completed);

  return { serviciosTopMes, tiempoPromedioPorServicio, desempenoPorMecanico };
}
