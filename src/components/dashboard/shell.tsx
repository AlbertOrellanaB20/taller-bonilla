"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar, type NavItem } from "./sidebar";
import { DashboardTopBar } from "./topbar";

export interface NotificationItem {
  id: string | number;
  text: string;
  href?: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  roleLabel: string;
  displayName: string;
  initials: string;
  badgeBg: string;
  badgeColor?: string;
  avatarGradient: string;
  accentColor?: string;
  activeBg?: string;
  sidebarWidth?: number;
  notificationCount?: number;
  notifications?: NotificationItem[];
  profileHref?: string;
  children: ReactNode;
}

export function DashboardShell({
  navItems,
  roleLabel,
  displayName,
  initials,
  badgeBg,
  badgeColor,
  avatarGradient,
  accentColor,
  activeBg,
  sidebarWidth,
  notificationCount,
  notifications,
  profileHref,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", background: "#1C1C1F" }}>
      <style>{`
        @media (max-width: 768px) {
          .tb-sidebar-desktop { display: none !important; }
          .tb-hamburger { display: flex !important; }
          .tb-clock { display: none !important; }
        }
      `}</style>

      <DashboardSidebar
        navItems={navItems}
        roleLabel={roleLabel}
        width={sidebarWidth}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        accentColor={accentColor}
        activeBg={activeBg}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <DashboardTopBar
          displayName={displayName}
          roleLabel={roleLabel}
          badgeBg={badgeBg}
          badgeColor={badgeColor}
          avatarGradient={avatarGradient}
          initials={initials}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          notificationCount={notificationCount}
          notifications={notifications}
          profileHref={profileHref}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>{children}</main>
      </div>
    </div>
  );
}
