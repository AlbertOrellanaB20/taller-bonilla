/**
 * Next.js redacta el mensaje de cualquier `throw` dentro de una Server Action
 * en producción (queda solo un "digest" genérico — así es como aparecía el
 * "Minified React error #441" al fallar una validación). La guía oficial del
 * framework para esta versión (node_modules/next/dist/docs/.../10-error-handling.md,
 * sección "Handling expected errors") es no lanzar errores esperados: se
 * devuelven como datos. Este tipo modela eso, y `unwrap()` los convierte de
 * vuelta a un `throw` normal, pero ya del lado del cliente — ahí sí llega el
 * mensaje intacto porque nunca cruza el límite servidor→cliente como excepción.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
