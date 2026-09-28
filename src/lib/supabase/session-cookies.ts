import type { CookieOptions } from "@supabase/ssr";

/**
 * Quita `maxAge`/`expires` de las cookies de sesión de Supabase para que el
 * navegador las trate como cookies de sesión (se borran solas al cerrar el
 * navegador). El sistema se usa en computadoras compartidas del taller —
 * CLAUDE.md exige que cada quien inicie sesión siempre de forma explícita,
 * nunca quedar conectado entre un turno y otro.
 */
export function asSessionCookie(options: CookieOptions): CookieOptions {
  const copy = { ...options };
  delete copy.maxAge;
  delete copy.expires;
  return copy;
}
