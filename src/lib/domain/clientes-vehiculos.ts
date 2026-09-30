"use server";

import { createClient } from "@/lib/supabase/server";
import { validarCliente, validarVehiculo } from "@/lib/validation";
import { type Result, ok, fail } from "@/lib/result";

export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
  dui: string;
  email: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  clientId: number;
}

interface ClienteRow {
  id_cliente: number;
  nombre_completo: string;
  telefono: string;
  direccion: string | null;
  dui: string | null;
  correo: string | null;
}

interface VehiculoRow {
  id_vehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  kilometraje: number | null;
  id_cliente: number;
}

function mapCliente(r: ClienteRow): Client {
  return { id: r.id_cliente, name: r.nombre_completo, phone: r.telefono, address: r.direccion ?? "", dui: r.dui ?? "", email: r.correo ?? "" };
}

function mapVehiculo(r: VehiculoRow): Vehicle {
  return {
    id: r.id_vehiculo,
    plate: r.placa,
    brand: r.marca,
    model: r.modelo,
    year: r.anio,
    color: r.color ?? "",
    mileage: r.kilometraje ?? 0,
    clientId: r.id_cliente,
  };
}

export async function listClientes(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cliente")
    .select("id_cliente, nombre_completo, telefono, direccion, dui, correo")
    .order("nombre_completo");
  if (error) {
    // Si todavía no se ha corrido el ALTER TABLE que agrega `correo` (ver
    // database/taller_bonilla_supabase.sql, sección 10.1.2), esta consulta
    // falla por completo y, como listClientes() se llama desde el layout de
    // Secretaria y Administrador, tumbaría TODO su panel — no solo la
    // pantalla de Clientes. Mientras tanto se reintenta sin esa columna y
    // el correo queda vacío, en vez de romper el resto del sistema.
    console.error("listClientes (con correo):", error.message);
    const fallback = await supabase
      .from("cliente")
      .select("id_cliente, nombre_completo, telefono, direccion, dui")
      .order("nombre_completo");
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data as Omit<ClienteRow, "correo">[]).map((r) => mapCliente({ ...r, correo: null }));
  }
  return (data as ClienteRow[]).map(mapCliente);
}

export async function listVehiculos(): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehiculo")
    .select("id_vehiculo, placa, marca, modelo, anio, color, kilometraje, id_cliente")
    .order("id_vehiculo", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as VehiculoRow[]).map(mapVehiculo);
}

/**
 * Devuelve { ok: false, error } en vez de lanzar `throw` para los fallos
 * esperados (validación, restricciones de la base de datos como DUI
 * duplicado). Next.js redacta el mensaje de cualquier error lanzado dentro
 * de una Server Action en producción (queda un "Minified React error #441"
 * sin mensaje útil) — ver src/lib/result.ts para el detalle completo.
 */
export async function crearCliente(input: Omit<Client, "id">): Promise<Result<Client>> {
  const errors = validarCliente(input);
  const firstError = Object.values(errors)[0];
  if (firstError) return fail(firstError);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cliente")
    .insert({
      nombre_completo: input.name.trim(),
      telefono: input.phone.trim(),
      direccion: input.address.trim() || null,
      dui: input.dui.trim() || null,
      correo: input.email.trim() || null,
    })
    .select("id_cliente, nombre_completo, telefono, direccion, dui, correo")
    .single();
  if (error) return fail(error.message);
  return ok(mapCliente(data as ClienteRow));
}

export async function crearVehiculo(input: Omit<Vehicle, "id">): Promise<Result<Vehicle>> {
  const errors = validarVehiculo(input);
  const firstError = Object.values(errors)[0];
  if (firstError) return fail(firstError);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehiculo")
    .insert({
      placa: input.plate.trim().toUpperCase(),
      marca: input.brand.trim(),
      modelo: input.model.trim(),
      anio: input.year,
      color: input.color.trim() || null,
      kilometraje: input.mileage || null,
      id_cliente: input.clientId,
    })
    .select("id_vehiculo, placa, marca, modelo, anio, color, kilometraje, id_cliente")
    .single();
  if (error) return fail(error.message);
  return ok(mapVehiculo(data as VehiculoRow));
}
