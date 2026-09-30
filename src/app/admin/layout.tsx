import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUsuarioActual, initialsFor, firstNameOf } from "@/lib/auth";
import type { NavItem } from "@/components/dashboard/sidebar";
import {
  IconDashboard,
  IconUsers,
  IconCarProfile,
  IconClipboard,
  IconBox,
  IconReceipt,
  IconBadge,
  IconChart,
  IconUserCog,
  IconSettings,
} from "@/components/dashboard/icons";
import { SecretariaDataProvider } from "@/app/secretaria/context";
import { InventarioDataProvider } from "@/app/inventario/context";
import { listClientes, listVehiculos } from "@/lib/domain/clientes-vehiculos";
import { listOrdenesSecretaria, listServiciosCatalogo } from "@/lib/domain/ordenes";
import { listOrdenesListasParaFacturar, listFacturas } from "@/lib/domain/facturacion";
import { listRepuestos, listProveedores } from "@/lib/domain/inventario";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/clientes", label: "Clientes", icon: <IconUsers /> },
  { href: "/admin/vehiculos", label: "Vehículos", icon: <IconCarProfile /> },
  { href: "/admin/ordenes", label: "Órdenes de Servicio", icon: <IconClipboard /> },
  { href: "/admin/inventario", label: "Inventario", icon: <IconBox /> },
  { href: "/admin/facturacion", label: "Facturación", icon: <IconReceipt /> },
  { href: "/admin/empleados", label: "Empleados", icon: <IconBadge /> },
  { href: "/admin/reportes", label: "Reportes", icon: <IconChart /> },
  { href: "/admin/usuarios", label: "Usuarios", icon: <IconUserCog /> },
  { href: "/admin/configuracion", label: "Configuración", icon: <IconSettings /> },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const [clients, vehicles, serviceOrders, readyOrders, invoices, catalogo, parts, suppliers] = await Promise.all([
    listClientes(),
    listVehiculos(),
    listOrdenesSecretaria(),
    listOrdenesListasParaFacturar(),
    listFacturas(),
    listServiciosCatalogo(),
    listRepuestos(),
    listProveedores(),
  ]);
  const notifications = readyOrders.map((o) => ({ id: o.id, text: `Lista para facturar: ${o.plate} — ${o.client}`, href: "/admin/facturacion" }));

  return (
    <DashboardShell
      navItems={NAV}
      roleLabel="Administrador"
      displayName={firstNameOf(usuario.nombreCompleto)}
      initials={initialsFor(usuario.nombreCompleto)}
      badgeBg="#A31212"
      avatarGradient="linear-gradient(135deg, #A31212 0%, #7a0d0d 100%)"
      sidebarWidth={240}
      notificationCount={notifications.length}
      notifications={notifications}
      profileHref="/admin/perfil"
    >
      <SecretariaDataProvider
        initialClients={clients}
        initialVehicles={vehicles}
        initialServiceOrders={serviceOrders}
        initialReadyOrders={readyOrders}
        initialInvoices={invoices}
        serviceCatalog={catalogo.map((s) => s.name)}
      >
        <InventarioDataProvider initialParts={parts} initialSuppliers={suppliers}>
          {children}
        </InventarioDataProvider>
      </SecretariaDataProvider>
    </DashboardShell>
  );
}
