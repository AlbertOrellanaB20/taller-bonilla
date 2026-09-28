import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleForPath, roleHomePath } from "@/lib/roles";
import { asSessionCookie } from "./session-cookies";

const PUBLIC_PATHS = ["/login"];

function redirectToLogin(request: NextRequest, reason?: "session_error") {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  if (reason) url.searchParams.set("aviso", reason);
  return NextResponse.redirect(url);
}

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
            supabaseResponse.cookies.set(name, value, asSessionCookie(options)),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Cualquier falla al hablar con Supabase (proyecto pausado, red caída,
  // tiempo de espera agotado, etc.) no debe tumbar la pantalla con un
  // error crudo de servidor: mandamos a /login con un aviso amable y que
  // la persona vuelva a intentar iniciar sesión.
  try {
    // IMPORTANT: do not run code between createServerClient and getUser().
    // A simple mistake could make it very hard to debug session refresh issues.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isPublicPath) return supabaseResponse;
      return redirectToLogin(request);
    }

    // Usuario autenticado: se determina su rol real (tabla usuario + rol) para
    // decidir a dónde puede entrar. Requiere la policy de RLS que permite a
    // cada usuario leer su propia fila en `usuario` (ver database/rls_politicas.sql).
    const { data: usuario } = await supabase
      .from("usuario")
      .select("activo, rol:id_rol(nombre_rol)")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ activo: boolean; rol: { nombre_rol: string } | null }>();

    if (!usuario || usuario.activo === false) {
      await supabase.auth.signOut();
      return redirectToLogin(request);
    }

    // Si ya hay sesión y visita /login o /, lo dejamos pasar: la propia
    // pantalla de login detecta la sesión activa y pregunta si quiere
    // cerrarla, en vez de mandarlo de una a su panel sin avisar.
    if (isPublicPath || pathname === "/") {
      return supabaseResponse;
    }

    const rolNombre = usuario.rol?.nombre_rol ?? null;
    const requiredRole = roleForPath(pathname);
    if (requiredRole && requiredRole !== rolNombre) {
      const url = request.nextUrl.clone();
      url.pathname = roleHomePath(rolNombre);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("proxy.ts: error verificando la sesión", error);
    return redirectToLogin(request, "session_error");
  }
}
