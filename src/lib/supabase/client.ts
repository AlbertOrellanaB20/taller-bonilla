import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";
import { asSessionCookie } from "./session-cookies";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          const parsed = parse(document.cookie);
          return Object.entries(parsed)
            .filter((entry): entry is [string, string] => entry[1] !== undefined)
            .map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            document.cookie = serialize(name, value, asSessionCookie(options));
          }
        },
      },
    },
  );
}
