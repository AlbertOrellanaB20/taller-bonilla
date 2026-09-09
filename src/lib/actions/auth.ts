"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleHomePath } from "@/lib/roles";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Por favor completa todos los campos." };
  }

  // 1. Buscar el correo asociado a ese nombre de usuario (con el cliente de
  // servicio, porque la tabla `usuario` no es de lectura pública).
  const admin = createAdminClient();
  const { data: usuario, error: lookupError } = await admin
    .from("usuario")
    .select("correo, activo")
    .ilike("nombre_usuario", username)
    .maybeSingle();

  if (lookupError || !usuario?.correo) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  if (!usuario.activo) {
    return { error: "Este usuario está desactivado. Contacta al administrador." };
  }

  // 2. Autenticar de verdad con Supabase Auth usando ese correo.
  const supabase = await createClient();
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: usuario.correo,
      password,
    });

  if (signInError || !signInData.user) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  // 3. Averiguar el rol para redirigir a su panel correspondiente.
  const { data: full } = await supabase
    .from("usuario")
    .select("rol:id_rol(nombre_rol)")
    .eq("auth_user_id", signInData.user.id)
    .maybeSingle<{ rol: { nombre_rol: string } | null }>();

  redirect(roleHomePath(full?.rol?.nombre_rol));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
