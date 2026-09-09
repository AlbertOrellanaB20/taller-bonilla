"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  roleLabel: string;
  width?: number;
  mobileOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  activeBg?: string;
}

export function DashboardSidebar({
  navItems,
  roleLabel,
  width = 220,
  mobileOpen,
  onClose,
  accentColor = "#A31212",
  activeBg = "rgba(163,18,18,0.15)",
}: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div style={{ width, height: "100%", background: "#0D0D0F", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e22", overflow: "hidden" }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Taller Bonilla</div>
          <div style={{ color: "#5a5a65", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{roleLabel}</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="tb-nav-item"
              style={{
                background: isActive ? activeBg : "transparent",
                color: isActive ? "#f0f0f2" : "#6a6a76",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ color: isActive ? accentColor : "inherit", flexShrink: 0, transition: "color 0.15s" }}>{item.icon}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              {isActive && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e22" }}>
        <p style={{ color: "#35353a", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>v1.0.0 · Taller Bonilla</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="tb-sidebar-desktop" style={{ width, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
        {content}
      </div>

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={onClose}>
          <div className="sidebar-slide" style={{ width, height: "100%", position: "relative", zIndex: 51 }} onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
        </div>
      )}
    </>
  );
}
