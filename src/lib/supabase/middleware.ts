import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleForPath, roleHomePath } from "@/lib/roles";

const PUBLIC_PATHS = ["/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  // A simple mistake could make it very hard to debug session refresh issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user) {
    if (isPublicPath) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Usuario autenticado: se determina su rol real (tabla usuario + rol) para
  // decidir a dónde puede entrar. Requiere la policy de RLS que permite a
  // cada usuario leer su propia fila en `usuario` (ver database/taller_bonilla_supabase.sql).
  const { data: usuario } = await supabase
    .from("usuario")
    .select("activo, rol:id_rol(nombre_rol)")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ activo: boolean; rol: { nombre_rol: string } | null }>();

  if (!usuario || usuario.activo === false) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const rolNombre = usuario.rol?.nombre_rol ?? null;
  const home = roleHomePath(rolNombre);

  if (isPublicPath || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  const requiredRole = roleForPath(pathname);
  if (requiredRole && requiredRole !== rolNombre) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
