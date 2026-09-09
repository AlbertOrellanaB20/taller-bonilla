export type RolNombre =
  | "Administrador"
  | "Supervisora"
  | "Secretario/a"
  | "Mecánico"
  | "Inventario";

export const ROLE_HOME: Record<RolNombre, string> = {
  Administrador: "/admin",
  Supervisora: "/supervisora",
  "Secretario/a": "/secretaria",
  Mecánico: "/mecanico",
  Inventario: "/inventario",
};

export function isRolNombre(value: string | null | undefined): value is RolNombre {
  return !!value && value in ROLE_HOME;
}

export function roleHomePath(rol: string | null | undefined): string {
  return isRolNombre(rol) ? ROLE_HOME[rol] : "/login";
}

/** A qué rol pertenece una ruta protegida, o null si es una ruta común (ej. /login). */
export function roleForPath(pathname: string): RolNombre | null {
  if (pathname.startsWith("/admin")) return "Administrador";
  if (pathname.startsWith("/supervisora")) return "Supervisora";
  if (pathname.startsWith("/secretaria")) return "Secretario/a";
  if (pathname.startsWith("/mecanico")) return "Mecánico";
  if (pathname.startsWith("/inventario")) return "Inventario";
  return null;
}
