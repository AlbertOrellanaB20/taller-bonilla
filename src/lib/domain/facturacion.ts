"use server";

import { createClient } from "@/lib/supabase/server";
import { toDMY } from "@/lib/format";
import { type Result, ok, fail } from "@/lib/result";

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

export interface InvoiceServiceLine {
  name: string;
  price: number;
}

export interface InvoicePartLine {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  number: string;
  orderId: number;
  plate: string;
  model: string;
  vehicleYear: number;
  client: string;
  clientDui: string;
  clientEmail: string;
  mechanic: string;
  services: string[];
  serviceLines: InvoiceServiceLine[];
  partLines: InvoicePartLine[];
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
  detalle_servicio: { servicio: { nombre_servicio: string } | null }[];
}

/**
 * Secretario/a no tiene permiso de leer la tabla `empleado` (es otro
 * módulo, ver database/rls_politicas.sql sección 4) ni `repuesto` (sección
 * 8), así que un join normal hacia esas tablas llega anulado por RLS —
 * el mecánico salía siempre "Sin asignar" y los repuestos desaparecían de
 * la factura aunque sí existieran. fn_mecanico_nombre_por_orden es una
 * función SECURITY DEFINER (ver rls_politicas.sql sección 12) que resuelve
 * el nombre por dentro, sin exponer la tabla empleado completa.
 */
async function mecanicosPorOrden(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordenIds: number[],
): Promise<Map<number, string>> {
  if (ordenIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("fn_mecanico_nombre_por_orden", { p_ids: ordenIds });
  if (error) {
    console.error("fn_mecanico_nombre_por_orden:", error.message);
    return new Map();
  }
  const map = new Map<number, string>();
  for (const row of data as { id_orden_servicio: number; mecanico_nombre: string }[]) {
    map.set(row.id_orden_servicio, row.mecanico_nombre);
  }
  return map;
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
        "id_orden_servicio, total, fecha_entrega_real, fecha_ingreso, vehiculo:id_vehiculo(placa, marca, modelo, cliente:id_cliente(nombre_completo)), detalle_servicio(servicio(nombre_servicio))",
      )
      .eq("id_estado_orden", (estadoFinalizado as { id_estado_orden: number }).id_estado_orden)
      .order("id_orden_servicio", { ascending: false }),
    supabase.from("factura").select("id_orden_servicio"),
  ]);
  if (ordenesError) throw new Error(ordenesError.message);
  if (facturadasError) throw new Error(facturadasError.message);

  const yaFacturadas = new Set((facturadas as { id_orden_servicio: number }[]).map((f) => f.id_orden_servicio));
  const pendientes = (ordenes as unknown as OrdenListaRow[]).filter((o) => !yaFacturadas.has(o.id_orden_servicio));
  const mecanicos = await mecanicosPorOrden(supabase, pendientes.map((o) => o.id_orden_servicio));

  return pendientes.map((o) => ({
    id: o.id_orden_servicio,
    plate: o.vehiculo?.placa ?? "—",
    model: `${o.vehiculo?.marca ?? ""} ${o.vehiculo?.modelo ?? ""}`.trim(),
    client: o.vehiculo?.cliente?.nombre_completo ?? "—",
    mechanic: mecanicos.get(o.id_orden_servicio) ?? "Sin asignar",
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
    vehiculo: { placa: string; marca: string; modelo: string; anio: number; cliente: { nombre_completo: string; dui: string | null; correo: string | null } | null } | null;
    detalle_servicio: { precio_aplicado: number; servicio: { nombre_servicio: string } | null }[];
  } | null;
}

/**
 * Igual que mecanicosPorOrden: Secretario/a no puede leer `repuesto`
 * directamente (es del módulo de Inventario), así que el nombre del
 * repuesto usado se resuelve con una función SECURITY DEFINER
 * (fn_repuestos_de_ordenes, rls_politicas.sql sección 12) en vez de un
 * join normal — de lo contrario esas líneas desaparecían de la factura y
 * el subtotal mostrado no cuadraba con lo que se veía en pantalla.
 */
async function repuestosPorOrden(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ordenIds: number[],
): Promise<Map<number, InvoicePartLine[]>> {
  const map = new Map<number, InvoicePartLine[]>();
  if (ordenIds.length === 0) return map;
  const { data, error } = await supabase.rpc("fn_repuestos_de_ordenes", { p_ids: ordenIds });
  if (error) {
    console.error("fn_repuestos_de_ordenes:", error.message);
    return map;
  }
  for (const row of data as { id_orden_servicio: number; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]) {
    const line: InvoicePartLine = { name: row.nombre, qty: row.cantidad, unitPrice: Number(row.precio_unitario), subtotal: Number(row.subtotal) };
    map.set(row.id_orden_servicio, [...(map.get(row.id_orden_servicio) ?? []), line]);
  }
  return map;
}

export async function listFacturas(): Promise<Invoice[]> {
  const supabase = await createClient();
  const baseSelect =
    "id_factura, numero_factura, id_orden_servicio, subtotal, iva, total, fecha_emision, estado_factura:id_estado_factura(nombre_estado), metodo_pago:id_metodo_pago(nombre_metodo), orden_servicio:id_orden_servicio(vehiculo:id_vehiculo(placa, marca, modelo, anio, cliente:id_cliente(nombre_completo, dui%s)), detalle_servicio(precio_aplicado, servicio(nombre_servicio)))";

  let { data, error } = await supabase
    .from("factura")
    .select(baseSelect.replace("%s", ", correo"))
    .order("id_factura", { ascending: false });
  if (error) {
    // Igual que en listClientes(): si `cliente.correo` todavía no existe
    // (falta correr el ALTER TABLE de taller_bonilla_supabase.sql sección
    // 10.1.2), no se debe romper TODO el panel de Secretaria/Administrador
    // por esto — se reintenta sin esa columna.
    console.error("listFacturas (con correo):", error.message);
    const fallback = await supabase
      .from("factura")
      .select(baseSelect.replace("%s", ""))
      .order("id_factura", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    data = fallback.data;
  }

  const rows = data as unknown as FacturaRow[];
  const ordenIds = rows.map((f) => f.id_orden_servicio);
  const [mecanicos, repuestos] = await Promise.all([mecanicosPorOrden(supabase, ordenIds), repuestosPorOrden(supabase, ordenIds)]);

  return rows.map((f) => {
    const serviceLines = (f.orden_servicio?.detalle_servicio ?? [])
      .filter((d) => d.servicio?.nombre_servicio)
      .map((d) => ({ name: d.servicio!.nombre_servicio, price: Number(d.precio_aplicado) }));
    const partLines = repuestos.get(f.id_orden_servicio) ?? [];

    return {
      id: f.id_factura,
      number: f.numero_factura,
      orderId: f.id_orden_servicio,
      plate: f.orden_servicio?.vehiculo?.placa ?? "—",
      model: `${f.orden_servicio?.vehiculo?.marca ?? ""} ${f.orden_servicio?.vehiculo?.modelo ?? ""}`.trim(),
      vehicleYear: f.orden_servicio?.vehiculo?.anio ?? 0,
      client: f.orden_servicio?.vehiculo?.cliente?.nombre_completo ?? "—",
      clientDui: f.orden_servicio?.vehiculo?.cliente?.dui ?? "",
      clientEmail: f.orden_servicio?.vehiculo?.cliente?.correo ?? "",
      mechanic: mecanicos.get(f.id_orden_servicio) ?? "Sin asignar",
      services: serviceLines.map((s) => s.name),
      serviceLines,
      partLines,
      subtotal: Number(f.subtotal),
      iva: Number(f.iva),
      total: Number(f.total),
      paymentMethod: (f.metodo_pago?.nombre_metodo as PayMethod) ?? "Efectivo",
      status: (f.estado_factura?.nombre_estado as InvoiceStatus) ?? "Pendiente",
      date: toDMY(f.fecha_emision),
    };
  });
}

export async function generarFactura(orderId: number, method: PayMethod): Promise<Result<{ number: string }>> {
  const supabase = await createClient();

  const { data: metodo, error: metodoError } = await supabase
    .from("metodo_pago")
    .select("id_metodo_pago")
    .eq("nombre_metodo", method)
    .single();
  if (metodoError || !metodo) return fail("Método de pago inválido.");

  const { data: facturaId, error } = await supabase.rpc("fn_generar_factura", {
    p_id_orden: orderId,
    p_id_metodo_pago: (metodo as { id_metodo_pago: number }).id_metodo_pago,
  });
  if (error) return fail(error.message);

  const { data: factura, error: readError } = await supabase
    .from("factura")
    .select("numero_factura")
    .eq("id_factura", facturaId as number)
    .single();
  if (readError || !factura) return fail("No se pudo leer la factura generada.");

  return ok({ number: (factura as { numero_factura: string }).numero_factura });
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

/**
 * Envía la factura por correo al cliente (PDF adjunto, mismo diseño que
 * "Imprimir"). Ver src/lib/email/factura-email.ts para lo que falta
 * configurar (la llave de Resend) — mientras no exista, esto devuelve un
 * error claro en vez de fallar en silencio.
 */
export async function enviarFacturaPorCorreo(invoiceId: number): Promise<Result<void>> {
  const { sendFacturaEmail } = await import("@/lib/email/factura-email");
  const facturas = await listFacturas();
  const invoice = facturas.find((f) => f.id === invoiceId);
  if (!invoice) return fail("No se encontró la factura.");
  if (!invoice.clientEmail) return fail(`${invoice.client} no tiene un correo registrado. Agrégalo en Clientes para poder enviarle la factura.`);

  const result = await sendFacturaEmail({ ...invoice, clientEmail: invoice.clientEmail });
  if (!result.ok) return fail(result.error);
  return ok(undefined);
}
