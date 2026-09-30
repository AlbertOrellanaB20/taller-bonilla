"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarUsuarioBasico } from "@/lib/validation";
import { type Result, ok, fail } from "@/lib/result";

export type Role = "Administrador" | "Supervisora" | "Secretario/a" | "Mecánico" | "Inventario";

export interface User {
  id: number;
  authUserId: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  active: boolean;
  specialty?: string;
}

export interface UserFormInput {
  name: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  specialty: string;
  active: boolean;
}

interface UsuarioRow {
  id_usuario: number;
  auth_user_id: string;
  nombre_completo: string;
  correo: string;
  nombre_usuario: string;
  activo: boolean;
  rol: { nombre_rol: Role } | null;
  empleado: { especialidad: string | null }[] | { especialidad: string | null } | null;
}

function especialidadDe(row: UsuarioRow) {
  const e = row.empleado;
  return Array.isArray(e) ? e[0]?.especialidad ?? undefined : e?.especialidad ?? undefined;
}

function mapUsuario(r: UsuarioRow): User {
  return {
    id: r.id_usuario,
    authUserId: r.auth_user_id,
    name: r.nombre_completo,
    email: r.correo,
    username: r.nombre_usuario,
    role: r.rol!.nombre_rol,
    active: r.activo,
    specialty: especialidadDe(r),
  };
}

function passwordError(password: string): string | null {
  const valida = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  return valida ? null : "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.";
}

export async function listUsuarios(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuario")
    .select("id_usuario, auth_user_id, nombre_completo, correo, nombre_usuario, activo, rol:id_rol(nombre_rol), empleado(especialidad)")
    .order("nombre_completo");
  if (error) throw new Error(error.message);
  return (data as unknown as UsuarioRow[]).map(mapUsuario);
}

export async function crearUsuario(input: UserFormInput): Promise<Result<User>> {
  const errors = validarUsuarioBasico(input);
  const firstError = Object.values(errors)[0];
  if (firstError) return fail(firstError);
  const pwError = passwordError(input.password);
  if (pwError) return fail(pwError);

  const admin = createAdminClient();

  const { data: rol, error: rolError } = await admin.from("rol").select("id_rol").eq("nombre_rol", input.role).single();
  if (rolError || !rol) return fail("Rol inválido.");

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
  });
  if (authError || !authUser.user) return fail(authError?.message ?? "No se pudo crear la cuenta de autenticación.");

  const { data: usuario, error: usuarioError } = await admin
    .from("usuario")
    .insert({
      id_rol: (rol as { id_rol: number }).id_rol,
      auth_user_id: authUser.user.id,
      nombre_completo: input.name.trim(),
      correo: input.email.trim(),
      nombre_usuario: input.username.trim().toLowerCase(),
      activo: input.active,
    })
    .select("id_usuario, auth_user_id, nombre_completo, correo, nombre_usuario, activo, rol:id_rol(nombre_rol)")
    .single();
  if (usuarioError || !usuario) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return fail(usuarioError?.code === "23505" ? "Ese nombre de usuario o correo ya existe." : usuarioError?.message ?? "No se pudo crear el usuario.");
  }

  let specialty: string | undefined;
  if (input.role === "Mecánico") {
    const codigo = input.username.trim().toUpperCase();
    const { error: empError } = await admin.from("empleado").insert({
      id_usuario: (usuario as unknown as { id_usuario: number }).id_usuario,
      codigo_empleado: codigo,
      especialidad: input.specialty.trim() || null,
    });
    if (empError) {
      await admin.from("usuario").delete().eq("id_usuario", (usuario as unknown as { id_usuario: number }).id_usuario);
      await admin.auth.admin.deleteUser(authUser.user.id);
      return fail(empError.message);
    }
    specialty = input.specialty.trim() || undefined;
  }

  return ok({ ...mapUsuario(usuario as unknown as UsuarioRow), specialty });
}

export async function actualizarUsuario(id: number, authUserId: string, input: UserFormInput): Promise<Result<User>> {
  const errors = validarUsuarioBasico(input);
  const firstError = Object.values(errors)[0];
  if (firstError) return fail(firstError);
  if (input.password) {
    const pwError = passwordError(input.password);
    if (pwError) return fail(pwError);
  }

  const admin = createAdminClient();

  const { data: rol, error: rolError } = await admin.from("rol").select("id_rol").eq("nombre_rol", input.role).single();
  if (rolError || !rol) return fail("Rol inválido.");

  const { error: authError } = await admin.auth.admin.updateUserById(authUserId, {
    email: input.email.trim(),
    ...(input.password ? { password: input.password } : {}),
  });
  if (authError) return fail(authError.message);

  const { data: usuario, error: usuarioError } = await admin
    .from("usuario")
    .update({
      id_rol: (rol as { id_rol: number }).id_rol,
      nombre_completo: input.name.trim(),
      correo: input.email.trim(),
      nombre_usuario: input.username.trim().toLowerCase(),
      activo: input.active,
    })
    .eq("id_usuario", id)
    .select("id_usuario, auth_user_id, nombre_completo, correo, nombre_usuario, activo, rol:id_rol(nombre_rol)")
    .single();
  if (usuarioError || !usuario) return fail(usuarioError?.code === "23505" ? "Ese nombre de usuario o correo ya existe." : usuarioError?.message ?? "No se pudo actualizar el usuario.");

  let specialty: string | undefined;
  if (input.role === "Mecánico") {
    const { data: existing } = await admin.from("empleado").select("id_empleado").eq("id_usuario", id).maybeSingle();
    if (existing) {
      await admin.from("empleado").update({ especialidad: input.specialty.trim() || null }).eq("id_usuario", id);
    } else {
      await admin.from("empleado").insert({ id_usuario: id, codigo_empleado: input.username.trim().toUpperCase(), especialidad: input.specialty.trim() || null });
    }
    specialty = input.specialty.trim() || undefined;
  }

  return ok({ ...mapUsuario(usuario as unknown as UsuarioRow), specialty });
}

export async function toggleActivoUsuario(id: number, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("usuario").update({ activo: active }).eq("id_usuario", id);
  if (error) throw new Error(error.message);
}

/** Autoservicio: la persona ya autenticada cambia su propia contraseña (no requiere el cliente admin). */
export async function cambiarMiPassword(newPassword: string): Promise<Result<void>> {
  const pwError = passwordError(newPassword);
  if (pwError) return fail(pwError);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return fail(error.message);
  return ok(undefined);
}

/** Genera una contraseña temporal segura y se la asigna a la cuenta (no hay envío de correo configurado). */
export async function restablecerPasswordUsuario(authUserId: string): Promise<string> {
  const admin = createAdminClient();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw = "A1!" + pw; // asegura que cumple mayúscula + número + especial
  const { error } = await admin.auth.admin.updateUserById(authUserId, { password: pw });
  if (error) throw new Error(error.message);
  return pw;
}
