import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la llave de servicio (service role).
 * Ignora las políticas de Row Level Security — úsalo SOLO en código de
 * servidor (Server Actions / Route Handlers), nunca en un componente cliente.
 *
 * Se usa para el login por nombre de usuario: antes de autenticar con
 * Supabase Auth necesitamos encontrar el correo asociado a ese usuario en la
 * tabla `usuario`, y esa tabla tiene RLS activado sin una política pública
 * de lectura por nombre de usuario (por seguridad, para no exponer la lista
 * de usuarios a cualquiera).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
