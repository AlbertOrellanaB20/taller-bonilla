import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { asSessionCookie } from "./session-cookies";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, asSessionCookie(options)),
            );
          } catch {
            // setAll called from a Server Component; ignored because
            // middleware.ts already refreshes the session on every request.
          }
        },
      },
    },
  );
}
