"use server";

import { createClient } from "@/lib/supabase/server";
import { toDMY } from "@/lib/format";
import { type Result, ok, fail } from "@/lib/result";

export type OrderStatus = "Pendiente" | "En Proceso" | "Finalizado" | "Entregado";

export interface ServicioCatalogo {
  id: number;
  name: string;
  price: number;
}

// ── Secretaria: crea la orden de recepción ──────────────────────────────────

export interface ServiceOrder {
  id: number;
  vehicleId: number;
  services: string[];
  receivedDate: string;
  estimatedDelivery: string;
}

// ── Supervisora: supervisa y reasigna ───────────────────────────────────────

export interface Order {
  id: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  mechanicId: number | null;
  status: string;
  entryDate: string;
  dueDate: string;
  overdue: boolean;
}

// ── Mecánico: sus órdenes asignadas ─────────────────────────────────────────

export interface MechanicOrder {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  client: string;
  clientPhone: string;
  services: string[];
  servicesDoneIds: number[];
  servicesDone: boolean[];
  status: OrderStatus;
  receivedDate: string;
  dueDate: string;
  notes: string;
  parts: { name: string; qty: number }[];
}

const UNASSIGNED = "Sin asignar";

async function estadoOrdenId(supabase: Awaited<ReturnType<typeof createClient>>, nombre: string): Promise<number> {
  const { data, error } = await supabase.from("estado_orden").select("id_estado_orden").eq("nombre_estado", nombre).single();
  if (error || !data) throw new Error(`No existe el estado de orden "${nombre}"`);
  return (data as { id_estado_orden: number }).id_estado_orden;
}

export async function listServiciosCatalogo(): Promise<ServicioCatalogo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("servicio").select("id_servicio, nombre_servicio, precio_base").order("nombre_servicio");
  if (error) throw new Error(error.message);
  return (data as { id_servicio: number; nombre_servicio: string; precio_base: number }[]).map((s) => ({
    id: s.id_servicio,
    name: s.nombre_servicio,
    price: Number(s.precio_base),
  }));
}

interface OrdenSecretariaRow {
  id_orden_servicio: number;
  id_vehiculo: number;
  fecha_ingreso: string;
  fecha_entrega_estimada: string | null;
  detalle_servicio: { servicio: { nombre_servicio: string } | null }[];
}

export async function listOrdenesSecretaria(): Promise<ServiceOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orden_servicio")
    .select("id_orden_servicio, id_vehiculo, fecha_ingreso, fecha_entrega_estimada, detalle_servicio(servicio(nombre_servicio))")
    .order("id_orden_servicio", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as OrdenSecretariaRow[]).map((o) => ({
    id: o.id_orden_servicio,
    vehicleId: o.id_vehiculo,
    services: o.detalle_servicio.map((d) => d.servicio?.nombre_servicio ?? "").filter(Boolean),
    receivedDate: toDMY(o.fecha_ingreso),
    estimatedDelivery: toDMY(o.fecha_entrega_estimada),
  }));
}

export async function crearOrden(vehicleId: number, serviceNames: string[], estimatedDeliveryISO: string): Promise<Result<ServiceOrder>> {
  if (!vehicleId || serviceNames.length === 0) return fail("Selecciona un vehículo y al menos un servicio.");
  const supabase = await createClient();

  const { data: catalogo, error: catError } = await supabase.from("servicio").select("id_servicio, nombre_servicio, precio_base").in("nombre_servicio", serviceNames);
  if (catError) return fail(catError.message);
  const catalogoRows = catalogo as { id_servicio: number; nombre_servicio: string; precio_base: number }[];
  if (catalogoRows.length === 0) return fail("Los servicios seleccionados no existen en el catálogo.");

  const idPendiente = await estadoOrdenId(supabase, "Pendiente");

  const { data: orden, error: ordenError } = await supabase
    .from("orden_servicio")
    .insert({ id_vehiculo: vehicleId, id_estado_orden: idPendiente, fecha_entrega_estimada: estimatedDeliveryISO })
    .select("id_orden_servicio, fecha_ingreso, fecha_entrega_estimada")
    .single();
  if (ordenError) return fail(ordenError.message);
  const ordenRow = orden as { id_orden_servicio: number; fecha_ingreso: string; fecha_entrega_estimada: string };

  const detalles = catalogoRows.map((s) => ({
    id_orden_servicio: ordenRow.id_orden_servicio,
    id_servicio: s.id_servicio,
    precio_aplicado: s.precio_base,
  }));
  const { error: detError } = await supabase.from("detalle_servicio").insert(detalles);
  if (detError) return fail(detError.message);

  return ok({
    id: ordenRow.id_orden_servicio,
    vehicleId,
    services: catalogoRows.map((s) => s.nombre_servicio),
    receivedDate: toDMY(ordenRow.fecha_ingreso),
    estimatedDelivery: toDMY(ordenRow.fecha_entrega_estimada),
  });
}

interface OrdenSupervisoraRow {
  id_orden_servicio: number;
  fecha_ingreso: string;
  fecha_entrega_estimada: string | null;
  id_empleado: number | null;
  estado_orden: { nombre_estado: string } | null;
  vehiculo: { placa: string; marca: string; modelo: string; cliente: { nombre_completo: string } | null } | null;
  empleado: { usuario: { nombre_completo: string } | null } | null;
}

export async function listOrdenesSupervisora(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orden_servicio")
    .select(
      "id_orden_servicio, fecha_ingreso, fecha_entrega_estimada, id_empleado, estado_orden:id_estado_orden(nombre_estado), vehiculo:id_vehiculo(placa, marca, modelo, cliente:id_cliente(nombre_completo)), empleado:id_empleado(usuario:id_usuario(nombre_completo))",
    )
    .order("id_orden_servicio", { ascending: false });
  if (error) throw new Error(error.message);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return (data as unknown as OrdenSupervisoraRow[]).map((o) => {
    const status = o.estado_orden?.nombre_estado ?? "Pendiente";
    const due = o.fecha_entrega_estimada ? new Date(o.fecha_entrega_estimada) : null;
    const overdue = !!due && due.getTime() < today.getTime() && status !== "Finalizado" && status !== "Entregado";
    return {
      id: o.id_orden_servicio,
      plate: o.vehiculo?.placa ?? "—",
      model: `${o.vehiculo?.marca ?? ""} ${o.vehiculo?.modelo ?? ""}`.trim(),
      client: o.vehiculo?.cliente?.nombre_completo ?? "—",
      mechanic: o.empleado?.usuario?.nombre_completo ?? UNASSIGNED,
      mechanicId: o.id_empleado,
      status,
      entryDate: toDMY(o.fecha_ingreso),
      dueDate: toDMY(o.fecha_entrega_estimada),
      overdue,
    };
  });
}

export async function reasignarMecanico(ordenId: number, empleadoId: number | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orden_servicio").update({ id_empleado: empleadoId }).eq("id_orden_servicio", ordenId);
  if (error) throw new Error(error.message);
}

export async function cambiarEstadoOrden(ordenId: number, nombreEstado: string): Promise<void> {
  const supabase = await createClient();
  const idEstado = await estadoOrdenId(supabase, nombreEstado);
  const update: { id_estado_orden: number; fecha_entrega_real?: string } = { id_estado_orden: idEstado };
  if (nombreEstado === "Finalizado" || nombreEstado === "Entregado") update.fecha_entrega_real = new Date().toISOString();
  const { error } = await supabase.from("orden_servicio").update(update).eq("id_orden_servicio", ordenId);
  if (error) throw new Error(error.message);
}

interface OrdenMecanicoRow {
  id_orden_servicio: number;
  fecha_ingreso: string;
  fecha_entrega_estimada: string | null;
  estado_orden: { nombre_estado: string } | null;
  vehiculo: { placa: string; marca: string; modelo: string; anio: number; cliente: { nombre_completo: string; telefono: string } | null } | null;
  detalle_servicio: { id_detalle_servicio: number; completado: boolean; servicio: { nombre_servicio: string } | null }[];
  detalle_repuesto: { cantidad: number; repuesto: { nombre: string } | null }[];
}

export async function listOrdenesMecanico(): Promise<MechanicOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orden_servicio")
    .select(
      "id_orden_servicio, fecha_ingreso, fecha_entrega_estimada, estado_orden:id_estado_orden(nombre_estado), vehiculo:id_vehiculo(placa, marca, modelo, anio, cliente:id_cliente(nombre_completo, telefono)), detalle_servicio(id_detalle_servicio, completado, servicio(nombre_servicio)), detalle_repuesto(cantidad, repuesto(nombre))",
    )
    .order("id_orden_servicio", { ascending: false });
  if (error) throw new Error(error.message);

  return (data as unknown as OrdenMecanicoRow[]).map((o) => ({
    id: o.id_orden_servicio,
    plate: o.vehiculo?.placa ?? "—",
    brand: o.vehiculo?.marca ?? "",
    model: o.vehiculo?.modelo ?? "",
    year: o.vehiculo?.anio ?? 0,
    client: o.vehiculo?.cliente?.nombre_completo ?? "—",
    clientPhone: o.vehiculo?.cliente?.telefono ?? "",
    services: o.detalle_servicio.map((d) => d.servicio?.nombre_servicio ?? "").filter(Boolean),
    servicesDoneIds: o.detalle_servicio.map((d) => d.id_detalle_servicio),
    servicesDone: o.detalle_servicio.map((d) => d.completado),
    status: (o.estado_orden?.nombre_estado as OrderStatus) ?? "Pendiente",
    receivedDate: toDMY(o.fecha_ingreso),
    dueDate: toDMY(o.fecha_entrega_estimada),
    notes: "",
    parts: o.detalle_repuesto.map((d) => ({ name: d.repuesto?.nombre ?? "", qty: d.cantidad })),
  }));
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Pendiente: "En Proceso",
  "En Proceso": "Finalizado",
  Finalizado: null,
  Entregado: null,
};

export async function avanzarEstadoOrden(ordenId: number): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orden_servicio")
    .select("estado_orden:id_estado_orden(nombre_estado)")
    .eq("id_orden_servicio", ordenId)
    .single();
  if (error) throw new Error(error.message);
  const actual = (data as unknown as { estado_orden: { nombre_estado: OrderStatus } | null }).estado_orden?.nombre_estado;
  const siguiente = actual ? NEXT_STATUS[actual] : null;
  if (!siguiente) return;
  await cambiarEstadoOrden(ordenId, siguiente);
}

export async function marcarServicioCompletado(idDetalleServicio: number, completado: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("detalle_servicio").update({ completado }).eq("id_detalle_servicio", idDetalleServicio);
  if (error) throw new Error(error.message);
}

export async function agregarRepuestoAOrden(ordenId: number, repuestoId: number, cantidad: number): Promise<Result<void>> {
  if (cantidad < 1) return fail("La cantidad debe ser al menos 1.");
  const supabase = await createClient();
  const { data: repuesto, error: repError } = await supabase
    .from("repuesto")
    .select("precio_unitario, stock_actual, nombre")
    .eq("id_repuesto", repuestoId)
    .single();
  if (repError || !repuesto) return fail("El repuesto seleccionado no existe.");
  const r = repuesto as { precio_unitario: number; stock_actual: number; nombre: string };
  if (r.stock_actual < cantidad) {
    return fail(`No hay suficiente stock de "${r.nombre}" (quedan ${r.stock_actual}).`);
  }

  const { error } = await supabase.from("detalle_repuesto").insert({
    id_orden_servicio: ordenId,
    id_repuesto: repuestoId,
    cantidad,
    precio_unitario_aplicado: r.precio_unitario,
  });
  if (error) return fail(error.message);
  return ok(undefined);
}
