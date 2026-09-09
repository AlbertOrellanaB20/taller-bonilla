"use client";

import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import type { NavItem } from "@/components/dashboard/sidebar";
import { useInventarioData } from "./context";

interface Props {
  navItems: NavItem[];
  displayName: string;
  initials: string;
  children: ReactNode;
}

export function InventarioShell({ navItems, displayName, initials, children }: Props) {
  const { criticalCount } = useInventarioData();

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel="Inventario"
      displayName={displayName}
      initials={initials}
      badgeBg="rgba(139,92,246,0.2)"
      badgeColor="#a78bfa"
      avatarGradient="linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)"
      accentColor="#a78bfa"
      activeBg="rgba(139,92,246,0.15)"
      sidebarWidth={200}
      notificationCount={criticalCount}
    >
      {children}
    </DashboardShell>
  );
}
