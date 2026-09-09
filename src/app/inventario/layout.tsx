import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconBox, IconTruck } from "@/components/dashboard/icons";
import { InventarioDataProvider } from "./context";
import { InventarioShell } from "./shell-with-data";

const NAV: NavItem[] = [
  { href: "/inventario", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/inventario/repuestos", label: "Repuestos", icon: <IconBox /> },
  { href: "/inventario/proveedores", label: "Proveedores", icon: <IconTruck /> },
];

export default async function InventarioLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <InventarioDataProvider>
      <InventarioShell navItems={NAV} displayName={firstNameOf(usuario.nombreCompleto)} initials={initialsFor(usuario.nombreCompleto)}>
        {children}
      </InventarioShell>
    </InventarioDataProvider>
  );
}
