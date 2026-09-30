import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconClipboard } from "@/components/dashboard/icons";
import { MecanicoDataProvider } from "./context";
import { listOrdenesMecanico } from "@/lib/domain/ordenes";
import { listRepuestos } from "@/lib/domain/inventario";

const NAV: NavItem[] = [
  { href: "/mecanico", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/mecanico/ordenes", label: "Mis Órdenes", icon: <IconClipboard /> },
];

export default async function MecanicoLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const [orders, partsCatalog] = await Promise.all([listOrdenesMecanico(), listRepuestos()]);
  const activas = orders.filter((o) => o.status === "Pendiente" || o.status === "En Proceso");
  const notifications = activas.map((o) => ({ id: o.id, text: `${o.plate} — ${o.status} (entrega ${o.dueDate})`, href: "/mecanico/ordenes" }));

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
      notificationCount={notifications.length}
      notifications={notifications}
      profileHref="/mecanico/perfil"
    >
      <MecanicoDataProvider initialOrders={orders} partsCatalog={partsCatalog}>
        {children}
      </MecanicoDataProvider>
    </DashboardShell>
  );
}
