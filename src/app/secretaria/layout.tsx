import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import { IconDashboard, IconUsers, IconCarBox, IconClipboard, IconReceipt } from "@/components/dashboard/icons";
import { SecretariaDataProvider } from "./context";
import { listClientes, listVehiculos } from "@/lib/domain/clientes-vehiculos";
import { listOrdenesSecretaria, listServiciosCatalogo } from "@/lib/domain/ordenes";
import { listOrdenesListasParaFacturar, listFacturas } from "@/lib/domain/facturacion";

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

  const [clients, vehicles, serviceOrders, readyOrders, invoices, catalogo] = await Promise.all([
    listClientes(),
    listVehiculos(),
    listOrdenesSecretaria(),
    listOrdenesListasParaFacturar(),
    listFacturas(),
    listServiciosCatalogo(),
  ]);
  const notifications = readyOrders.map((o) => ({ id: o.id, text: `Lista para facturar: ${o.plate} — ${o.client}`, href: "/secretaria/facturacion" }));

  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Secretario/a"
      displayName={firstNameOf(usuario.nombreCompleto)}
      initials={initialsFor(usuario.nombreCompleto)}
      badgeBg="#1d4ed8"
      avatarGradient="linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)"
      sidebarWidth={210}
      notificationCount={notifications.length}
      notifications={notifications}
      profileHref="/secretaria/perfil"
    >
      <SecretariaDataProvider
        initialClients={clients}
        initialVehicles={vehicles}
        initialServiceOrders={serviceOrders}
        initialReadyOrders={readyOrders}
        initialInvoices={invoices}
        serviceCatalog={catalogo.map((s) => s.name)}
      >
        {children}
      </SecretariaDataProvider>
    </DashboardShell>
  );
}
