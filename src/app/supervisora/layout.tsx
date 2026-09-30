import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconClipboard, IconBadge, IconChart } from "@/components/dashboard/icons";
import { listOrdenesSupervisora } from "@/lib/domain/ordenes";

const NAV: NavItem[] = [
  { href: "/supervisora", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/supervisora/ordenes", label: "Órdenes de Servicio", icon: <IconClipboard /> },
  { href: "/supervisora/empleados", label: "Empleados", icon: <IconBadge /> },
  { href: "/supervisora/reportes", label: "Reportes", icon: <IconChart /> },
];

export default async function SupervisoraLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const orders = await listOrdenesSupervisora();
  const sinAsignar = orders.filter((o) => o.mechanicId === null && o.status !== "Entregado");
  const retrasadas = orders.filter((o) => o.overdue);
  const notifications = [
    ...sinAsignar.map((o) => ({ id: `sa-${o.id}`, text: `Sin asignar: ${o.plate} — ${o.client}`, href: "/supervisora/ordenes" })),
    ...retrasadas.map((o) => ({ id: `rt-${o.id}`, text: `Retrasada: ${o.plate} — ${o.client}`, href: "/supervisora/ordenes" })),
  ];

  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Supervisora"
      displayName={firstNameOf(usuario.nombreCompleto)}
      initials={initialsFor(usuario.nombreCompleto)}
      badgeBg="#b45309"
      avatarGradient="linear-gradient(135deg, #b45309 0%, #92400e 100%)"
      sidebarWidth={240}
      notificationCount={notifications.length}
      notifications={notifications}
      profileHref="/supervisora/perfil"
    >
      {children}
    </DashboardShell>
  );
}
