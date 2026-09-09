import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconClipboard } from "@/components/dashboard/icons";
import { MecanicoDataProvider } from "./context";

const NAV: NavItem[] = [
  { href: "/mecanico", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/mecanico/ordenes", label: "Mis Órdenes", icon: <IconClipboard /> },
];

export default async function MecanicoLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Mecánico"
      displayName={firstNameOf(usuario.nombreCompleto)}
      initials={initialsFor(usuario.nombreCompleto)}
      badgeBg="#166534"
      badgeColor="#4ade80"
      avatarGradient="linear-gradient(135deg, #166534 0%, #14532d 100%)"
      sidebarWidth={200}
      notificationCount={2}
    >
      <MecanicoDataProvider>{children}</MecanicoDataProvider>
    </DashboardShell>
  );
}
