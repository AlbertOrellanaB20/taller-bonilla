import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Antes se llamaba middleware.ts — Next.js 16 renombró la convención a
// proxy.ts (misma función, solo cambia el nombre del archivo y del export).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
