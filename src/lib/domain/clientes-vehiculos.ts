"use server";

import { createClient } from "@/lib/supabase/server";
import { validarCliente } from "@/lib/validation";

export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
  dui: string;
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
  return { id: r.id_cliente, name: r.nombre_completo, phone: r.telefono, address: r.direccion ?? "", dui: r.dui ?? "" };
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
    .select("id_cliente, nombre_completo, telefono, direccion, dui")
    .order("nombre_completo");
  if (error) throw new Error(error.message);
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

export async function crearCliente(input: Omit<Client, "id">): Promise<Client> {
  const errors = validarCliente(input);
  const firstError = Object.values(errors)[0];
  if (firstError) throw new Error(firstError);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cliente")
    .insert({
      nombre_completo: input.name.trim(),
      telefono: input.phone.trim(),
      direccion: input.address.trim() || null,
      dui: input.dui.trim() || null,
    })
    .select("id_cliente, nombre_completo, telefono, direccion, dui")
    .single();
  if (error) throw new Error(error.message);
  return mapCliente(data as ClienteRow);
}

export async function crearVehiculo(input: Omit<Vehicle, "id">): Promise<Vehicle> {
  if (!input.plate.trim() || !input.brand.trim()) throw new Error("Placa y marca son obligatorias.");
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
  if (error) throw new Error(error.message);
  return mapVehiculo(data as VehiculoRow);
}
