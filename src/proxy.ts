import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Antes se llamaba middleware.ts — Next.js 16 renombró la convención a
// proxy.ts (misma función, solo cambia el nombre del archivo y del export).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // sw.js queda afuera a propósito: es el script del service worker (PWA) y
  // los navegadores rechazan instalar uno cuyo archivo llega por una
  // redirección — si el proxy lo intercepta y no hay sesión, lo manda a
  // /login y el navegador tira "script resource is behind a redirect".
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
