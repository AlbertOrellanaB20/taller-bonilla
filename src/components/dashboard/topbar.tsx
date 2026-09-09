"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/auth";
import { IconBell, IconMenu } from "./icons";

interface TopBarProps {
  displayName: string;
  roleLabel: string;
  badgeBg: string;
  badgeColor?: string;
  avatarGradient: string;
  initials: string;
  onMenuToggle: () => void;
  notificationCount?: number;
  /** Si se pasa, "Mi perfil" navega ahí (solo Administrador lo usa hoy). */
  profileHref?: string;
}

export function DashboardTopBar({
  displayName,
  roleLabel,
  badgeBg,
  badgeColor = "#fff",
  avatarGradient,
  initials,
  onMenuToggle,
  notificationCount = 0,
  profileHref,
}: TopBarProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setTime(new Date()));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { cancelAnimationFrame(raf); clearInterval(timer); };
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const timeStr = time?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) ?? "";
  const dateStr = time?.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }) ?? "";

  const menuItemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color: "#c0c0c8",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    textDecoration: "none",
    fontFamily: "inherit",
    transition: "background 0.15s",
  };

  return (
    <div style={{ height: 64, background: "#161618", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
      <button
        className="tb-hamburger"
        onClick={onMenuToggle}
        style={{ background: "none", border: "none", color: "#8a8a96", cursor: "pointer", display: "none", alignItems: "center", padding: 4 }}
      >
        <IconMenu />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>Hola, {displayName} 👋</span>
          <span style={{ background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{roleLabel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>En vivo</span>
          </div>
        </div>
      </div>

      <div className="tb-clock" style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</div>
        <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "capitalize" }}>{dateStr}</div>
      </div>

      <button
        style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 8, padding: "7px 8px", cursor: "pointer", color: "#8a8a96", display: "flex", alignItems: "center", transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,18,18,0.1)"; e.currentTarget.style.color = "#A31212"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}
      >
        <IconBell />
        {notificationCount > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "#A31212", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {notificationCount}
          </span>
        )}
      </button>

      <div ref={avatarRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setAvatarOpen((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: avatarGradient, border: "2px solid #2a2a2e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
        >
          {initials}
        </button>

        {avatarOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 180, background: "#212125", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2a2e" }}>
              <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>{displayName}</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>{roleLabel}</div>
            </div>
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={() => setAvatarOpen(false)}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Mi perfil
              </Link>
            ) : (
              <button
                onClick={() => setAvatarOpen(false)}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Mi perfil
              </button>
            )}
            <button
              onClick={() => logout()}
              style={{ ...menuItemStyle, color: "#e87070" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,18,18,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
