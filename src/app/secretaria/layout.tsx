import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconUsers, IconCarBox, IconClipboard, IconReceipt } from "@/components/dashboard/icons";
import { SecretariaDataProvider } from "./context";

const NAV: NavItem[] = [
  { href: "/secretaria", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/secretaria/clientes", label: "Clientes", icon: <IconUsers /> },
  { href: "/secretaria/vehiculos", label: "Vehículos", icon: <IconCarBox /> },
  { href: "/secretaria/ordenes", label: "Órdenes de Servicio", icon: <IconClipboard /> },
  { href: "/secretaria/facturacion", label: "Facturación", icon: <IconReceipt /> },
];

export default async function SecretariaLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Secretario/a"
      displayName={firstNameOf(usuario.nombreCompleto)}
      initials={initialsFor(usuario.nombreCompleto)}
      badgeBg="#1d4ed8"
      avatarGradient="linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)"
      sidebarWidth={210}
      notificationCount={1}
    >
      <SecretariaDataProvider>{children}</SecretariaDataProvider>
    </DashboardShell>
  );
}
