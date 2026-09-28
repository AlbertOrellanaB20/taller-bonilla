"use server";

import { createClient } from "@/lib/supabase/server";

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  active: boolean;
}

export interface Part {
  id: number;
  code: string;
  name: string;
  supplierId: number;
  stock: number;
  minStock: number;
  price: number;
}

interface ProveedorRow {
  id_proveedor: number;
  nombre: string;
  telefono: string | null;
  activo: boolean;
}

interface RepuestoRow {
  id_repuesto: number;
  codigo: string;
  nombre: string;
  id_proveedor: number | null;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
}

function mapProveedor(r: ProveedorRow): Supplier {
  return { id: r.id_proveedor, name: r.nombre, phone: r.telefono ?? "", active: r.activo };
}

function mapRepuesto(r: RepuestoRow): Part {
  return {
    id: r.id_repuesto,
    code: r.codigo,
    name: r.nombre,
    supplierId: r.id_proveedor ?? 0,
    stock: r.stock_actual,
    minStock: r.stock_minimo,
    price: Number(r.precio_unitario),
  };
}

export async function listProveedores(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("proveedor").select("id_proveedor, nombre, telefono, activo").order("nombre");
  if (error) throw new Error(error.message);
  return (data as ProveedorRow[]).map(mapProveedor);
}

export async function listRepuestos(): Promise<Part[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repuesto")
    .select("id_repuesto, codigo, nombre, id_proveedor, stock_actual, stock_minimo, precio_unitario")
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data as RepuestoRow[]).map(mapRepuesto);
}

export async function crearProveedor(name: string, phone: string): Promise<Supplier> {
  if (!name.trim()) throw new Error("El nombre del proveedor es obligatorio.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proveedor")
    .insert({ nombre: name.trim(), telefono: phone.trim() || null })
    .select("id_proveedor, nombre, telefono, activo")
    .single();
  if (error) throw new Error(error.message);
  return mapProveedor(data as ProveedorRow);
}

export async function toggleActivoProveedor(id: number, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("proveedor").update({ activo: active }).eq("id_proveedor", id);
  if (error) throw new Error(error.message);
}

export async function crearRepuesto(input: Omit<Part, "id">): Promise<Part> {
  if (!input.code.trim() || !input.name.trim()) throw new Error("Código y nombre son obligatorios.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repuesto")
    .insert({
      codigo: input.code.trim().toUpperCase(),
      nombre: input.name.trim(),
      id_proveedor: input.supplierId || null,
      stock_actual: input.stock,
      stock_minimo: input.minStock,
      precio_unitario: input.price,
    })
    .select("id_repuesto, codigo, nombre, id_proveedor, stock_actual, stock_minimo, precio_unitario")
    .single();
  if (error) throw new Error(error.message);
  return mapRepuesto(data as RepuestoRow);
}

export interface UsoRepuesto {
  name: string;
  used: number;
}

export async function listRepuestosMasUsadosMes(): Promise<UsoRepuesto[]> {
  const supabase = await createClient();
  // Inventario no tiene permiso de leer orden_servicio (ver rls_politicas.sql),
  // así que este cruce se hace con una función SECURITY DEFINER en vez de un
  // select con join directo — de lo contrario RLS anula el lado de la orden
  // y el widget sale vacío siempre. Ver database/rls_politicas.sql, sección 11.
  const { data, error } = await supabase.rpc("fn_repuestos_mas_usados_mes");
  if (error) throw new Error(error.message);
  return (data as { nombre: string; usado: number }[]).map((d) => ({ name: d.nombre, used: Number(d.usado) }));
}

export async function ajustarStock(partId: number, type: "entrada" | "salida", qty: number, reason: string): Promise<Part> {
  if (qty < 1 || !reason.trim()) throw new Error("Cantidad y motivo son obligatorios.");
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("repuesto")
    .select("stock_actual")
    .eq("id_repuesto", partId)
    .single();
  if (readError) throw new Error(readError.message);

  const delta = type === "entrada" ? qty : -qty;
  const nuevoStock = Math.max(0, (current as { stock_actual: number }).stock_actual + delta);

  const { data, error } = await supabase
    .from("repuesto")
    .update({ stock_actual: nuevoStock })
    .eq("id_repuesto", partId)
    .select("id_repuesto, codigo, nombre, id_proveedor, stock_actual, stock_minimo, precio_unitario")
    .single();
  if (error) throw new Error(error.message);
  return mapRepuesto(data as RepuestoRow);
}
