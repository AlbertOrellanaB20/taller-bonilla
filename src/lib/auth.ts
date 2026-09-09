import { createClient } from "@/lib/supabase/server";

export interface UsuarioActual {
  nombreCompleto: string;
  nombreUsuario: string;
  rol: string;
}

export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("nombre_completo, nombre_usuario, rol:id_rol(nombre_rol)")
    .eq("auth_user_id", user.id)
    .maybeSingle<{
      nombre_completo: string;
      nombre_usuario: string;
      rol: { nombre_rol: string } | null;
    }>();

  if (!data) return null;

  return {
    nombreCompleto: data.nombre_completo,
    nombreUsuario: data.nombre_usuario,
    rol: data.rol?.nombre_rol ?? "",
  };
}

export function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function firstNameOf(name: string): string {
  return name.trim().split(" ")[0] ?? name;
}
