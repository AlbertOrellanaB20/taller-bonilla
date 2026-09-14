"use server";

import { createClient } from "@/lib/supabase/server";
import { toDMY } from "@/lib/format";

export type PayMethod = "Efectivo" | "Tarjeta" | "Transferencia";
export type InvoiceStatus = "Pagada" | "Pendiente" | "Anulada";

export interface ReadyOrder {
  id: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  services: string[];
  subtotal: number;
  completedDate: string;
}

export interface Invoice {
  id: number;
  number: string;
  orderId: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  services: string[];
  subtotal: number;
  iva: number;
  total: number;
  paymentMethod: PayMethod;
  status: InvoiceStatus;
  date: string;
}

interface OrdenListaRow {
  id_orden_servicio: number;
  total: number;
  fecha_entrega_real: string | null;
  fecha_ingreso: string;
  vehiculo: { placa: string; marca: string; modelo: string; cliente: { nombre_completo: string } | null } | null;
  empleado: { usuario: { nombre_completo: string } | null } | null;
  detalle_servicio: { servicio: { nombre_servicio: string } | null }[];
}

export async function listOrdenesListasParaFacturar(): Promise<ReadyOrder[]> {
  const supabase = await createClient();

  const { data: estadoFinalizado, error: estadoError } = await supabase
    .from("estado_orden")
    .select("id_estado_orden")
    .eq("nombre_estado", "Finalizado")
    .single();
  if (estadoError || !estadoFinalizado) throw new Error("No existe el estado de orden \"Finalizado\".");

  const [{ data: ordenes, error: ordenesError }, { data: facturadas, error: facturadasError }] = await Promise.all([
    supabase
      .from("orden_servicio")
      .select(
        "id_orden_servicio, total, fecha_entrega_real, fecha_ingreso, vehiculo:id_vehiculo(placa, marca, modelo, cliente:id_cliente(nombre_completo)), empleado:id_empleado(usuario:id_usuario(nombre_completo)), detalle_servicio(servicio(nombre_servicio))",
      )
      .eq("id_estado_orden", (estadoFinalizado as { id_estado_orden: number }).id_estado_orden)
      .order("id_orden_servicio", { ascending: false }),
    supabase.from("factura").select("id_orden_servicio"),
  ]);
  if (ordenesError) throw new Error(ordenesError.message);
  if (facturadasError) throw new Error(facturadasError.message);

  const yaFacturadas = new Set((facturadas as { id_orden_servicio: number }[]).map((f) => f.id_orden_servicio));

  return (ordenes as unknown as OrdenListaRow[])
    .filter((o) => !yaFacturadas.has(o.id_orden_servicio))
    .map((o) => ({
      id: o.id_orden_servicio,
      plate: o.vehiculo?.placa ?? "—",
      model: `${o.vehiculo?.marca ?? ""} ${o.vehiculo?.modelo ?? ""}`.trim(),
      client: o.vehiculo?.cliente?.nombre_completo ?? "—",
      mechanic: o.empleado?.usuario?.nombre_completo ?? "Sin asignar",
      services: o.detalle_servicio.map((d) => d.servicio?.nombre_servicio ?? "").filter(Boolean),
      subtotal: Number(o.total),
      completedDate: toDMY(o.fecha_entrega_real ?? o.fecha_ingreso),
    }));
}

interface FacturaRow {
  id_factura: number;
  numero_factura: string;
  id_orden_servicio: number;
  subtotal: number;
  iva: number;
  total: number;
  fecha_emision: string;
  estado_factura: { nombre_estado: string } | null;
  metodo_pago: { nombre_metodo: string } | null;
  orden_servicio: {
    vehiculo: { placa: string; marca: string; modelo: string; cliente: { nombre_completo: string } | null } | null;
    empleado: { usuario: { nombre_completo: string } | null } | null;
    detalle_servicio: { servicio: { nombre_servicio: string } | null }[];
  } | null;
}

export async function listFacturas(): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("factura")
    .select(
      "id_factura, numero_factura, id_orden_servicio, subtotal, iva, total, fecha_emision, estado_factura:id_estado_factura(nombre_estado), metodo_pago:id_metodo_pago(nombre_metodo), orden_servicio:id_orden_servicio(vehiculo:id_vehiculo(placa, marca, modelo, cliente:id_cliente(nombre_completo)), empleado:id_empleado(usuario:id_usuario(nombre_completo)), detalle_servicio(servicio(nombre_servicio)))",
    )
    .order("id_factura", { ascending: false });
  if (error) throw new Error(error.message);

  return (data as unknown as FacturaRow[]).map((f) => ({
    id: f.id_factura,
    number: f.numero_factura,
    orderId: f.id_orden_servicio,
    plate: f.orden_servicio?.vehiculo?.placa ?? "—",
    model: `${f.orden_servicio?.vehiculo?.marca ?? ""} ${f.orden_servicio?.vehiculo?.modelo ?? ""}`.trim(),
    client: f.orden_servicio?.vehiculo?.cliente?.nombre_completo ?? "—",
    mechanic: f.orden_servicio?.empleado?.usuario?.nombre_completo ?? "Sin asignar",
    services: (f.orden_servicio?.detalle_servicio ?? []).map((d) => d.servicio?.nombre_servicio ?? "").filter(Boolean),
    subtotal: Number(f.subtotal),
    iva: Number(f.iva),
    total: Number(f.total),
    paymentMethod: (f.metodo_pago?.nombre_metodo as PayMethod) ?? "Efectivo",
    status: (f.estado_factura?.nombre_estado as InvoiceStatus) ?? "Pendiente",
    date: toDMY(f.fecha_emision),
  }));
}

export async function generarFactura(orderId: number, method: PayMethod): Promise<{ number: string }> {
  const supabase = await createClient();

  const { data: metodo, error: metodoError } = await supabase
    .from("metodo_pago")
    .select("id_metodo_pago")
    .eq("nombre_metodo", method)
    .single();
  if (metodoError || !metodo) throw new Error("Método de pago inválido.");

  const { data: facturaId, error } = await supabase.rpc("fn_generar_factura", {
    p_id_orden: orderId,
    p_id_metodo_pago: (metodo as { id_metodo_pago: number }).id_metodo_pago,
  });
  if (error) throw new Error(error.message);

  const { data: factura, error: readError } = await supabase
    .from("factura")
    .select("numero_factura")
    .eq("id_factura", facturaId as number)
    .single();
  if (readError || !factura) throw new Error("No se pudo leer la factura generada.");

  return { number: (factura as { numero_factura: string }).numero_factura };
}

export async function marcarFacturaPagada(id: number): Promise<void> {
  const supabase = await createClient();
  const { data: estado } = await supabase.from("estado_factura").select("id_estado_factura").eq("nombre_estado", "Pagada").single();
  const { error } = await supabase.from("factura").update({ id_estado_factura: (estado as { id_estado_factura: number }).id_estado_factura }).eq("id_factura", id);
  if (error) throw new Error(error.message);
}

export async function anularFactura(id: number): Promise<void> {
  const supabase = await createClient();
  const { data: estado } = await supabase.from("estado_factura").select("id_estado_factura").eq("nombre_estado", "Anulada").single();
  const { error } = await supabase.from("factura").update({ id_estado_factura: (estado as { id_estado_factura: number }).id_estado_factura }).eq("id_factura", id);
  if (error) throw new Error(error.message);
}
