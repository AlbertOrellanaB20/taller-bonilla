import { useState, useEffect, useRef } from "react";
import { Session } from "./App";
import SupervisoraHome from "./SupervisoraHome";
import SupervisoraEmpleados from "./SupervisoraEmpleados";
import SupervisoraReportes from "./SupervisoraReportes";
import logoImg from "@/imports/Logo.png";

type SvSection = "dashboard" | "ordenes" | "empleados" | "reportes";

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function IconClipboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
}
function IconBadge() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
}
function IconChart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IconBell() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function IconMenu() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}

const NAV: { id: SvSection; label: string; icon: JSX.Element }[] = [
  { id: "dashboard", label: "Dashboard",           icon: <IconDashboard /> },
  { id: "ordenes",   label: "Órdenes de Servicio", icon: <IconClipboard /> },
  { id: "empleados", label: "Empleados",            icon: <IconBadge /> },
  { id: "reportes",  label: "Reportes",             icon: <IconChart /> },
];

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  active: SvSection;
  onSelect: (s: SvSection) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

function Sidebar({ active, onSelect, mobileOpen, onClose }: SidebarProps) {
  const W = 240;
  const content = (
    <div style={{ width: W, height: "100%", background: "#0D0D0F", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e22", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Taller Bonilla</div>
          <div style={{ color: "#5a5a65", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Supervisora</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button key={item.id}
              onClick={() => { onSelect(item.id); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: isActive ? "rgba(163,18,18,0.15)" : "transparent", color: isActive ? "#f0f0f2" : "#6a6a76", fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "all 0.15s", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#c0c0c8"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6a6a76"; } }}
            >
              <span style={{ color: isActive ? "#A31212" : "inherit", flexShrink: 0, transition: "color 0.15s" }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#A31212" }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e22" }}>
        <p style={{ color: "#35353a", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>v1.0.0 · Taller Bonilla</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="sv-sidebar-desktop" style={{ width: W, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>{content}</div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={onClose}>
          <div className="sidebar-slide" style={{ width: W, height: "100%", position: "relative", zIndex: 51 }} onClick={(e) => e.stopPropagation()}>{content}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
        </div>
      )}
    </>
  );
}

// ── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  username: string;
  onLogout: () => void;
  onMenuToggle: () => void;
}

function TopBar({ username, onLogout, onMenuToggle }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const initials = username.slice(0, 2).toUpperCase();
  const displayName = "Nahomy";

  return (
    <div style={{ height: 64, background: "#161618", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
      <button className="sv-hamburger" onClick={onMenuToggle} style={{ background: "none", border: "none", color: "#8a8a96", cursor: "pointer", display: "none", alignItems: "center", padding: 4 }}>
        <IconMenu />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>Hola, {displayName} 👋</span>
          <span style={{ background: "#b45309", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Supervisora</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>En vivo</span>
          </div>
        </div>
      </div>

      {/* Clock */}
      <div className="sv-clock" style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</div>
        <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "capitalize" }}>{dateStr}</div>
      </div>

      {/* Notifications */}
      <button style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 8, padding: "7px 8px", cursor: "pointer", color: "#8a8a96", display: "flex", alignItems: "center", transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,18,18,0.1)"; e.currentTarget.style.color = "#A31212"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
        <IconBell />
        <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "#A31212", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
      </button>

      {/* Avatar */}
      <div ref={avatarRef} style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setAvatarOpen((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)", border: "2px solid #2a2a2e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#b45309")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2e")}>
          {initials}
        </button>
        {avatarOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 180, background: "#212125", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2a2e" }}>
              <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>{displayName}</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>Supervisora</div>
            </div>
            <button onClick={() => setAvatarOpen(false)}
              style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#c0c0c8", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              Mi perfil
            </button>
            <button onClick={() => { setAvatarOpen(false); onLogout(); }}
              style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#e87070", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,18,18,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

interface Props {
  session: Session;
  onLogout: () => void;
}

export default function SupervisoraDashboard({ session, onLogout }: Props) {
  const [active, setActive] = useState<SvSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", background: "#1C1C1F", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .sv-sidebar-desktop { display: none !important; }
          .sv-hamburger { display: flex !important; }
          .sv-clock { display: none !important; }
        }
      `}</style>

      <Sidebar active={active} onSelect={setActive} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar username={session.username} onLogout={onLogout} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {active === "dashboard" && <SupervisoraHome onNavigate={setActive} />}
          {active === "ordenes"   && <SupervisoraHome onNavigate={setActive} focusTable />}
          {active === "empleados" && <SupervisoraEmpleados />}
          {active === "reportes"  && <SupervisoraReportes />}
        </main>
      </div>
    </div>
  );
}
