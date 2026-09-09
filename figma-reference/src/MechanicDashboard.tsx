import { useState, useEffect, useRef } from "react";
import { Session } from "./App";
import logoImg from "@/imports/Logo.png";

// ── Data ──────────────────────────────────────────────────────────────────────

type OrderStatus = "Pendiente" | "En Proceso" | "Finalizado";

interface MechanicOrder {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  client: string;
  clientPhone: string;
  services: string[];
  servicesDone: boolean[];
  status: OrderStatus;
  receivedDate: string;
  dueDate: string;
  notes: string;
  parts: { name: string; qty: number }[];
}

const PARTS_CATALOG = [
  "Filtro de aceite",
  "Filtro de aire",
  "Filtro de combustible",
  "Pastillas de freno delanteras",
  "Pastillas de freno traseras",
  "Disco de freno",
  "Correa de distribución",
  "Bujías (x4)",
  "Líquido de frenos",
  "Refrigerante",
  "Aceite de motor 5W-30",
  "Aceite de motor 10W-40",
  "Correa serpentina",
  "Batería 12V",
  "Amortiguador delantero",
  "Amortiguador trasero",
  "Balancines",
  "Bobina de encendido",
  "Sensor de oxígeno",
  "Termostato",
];

const INITIAL_ORDERS: MechanicOrder[] = [
  {
    id: 1,
    plate: "ABC-1234", brand: "Toyota", model: "Corolla", year: 2019,
    client: "Juan Pérez", clientPhone: "7123-4567",
    services: ["Cambio de aceite y filtro", "Diagnóstico electrónico", "Revisión de frenos"],
    servicesDone: [true, false, false],
    status: "En Proceso",
    receivedDate: "07/09/2026", dueDate: "09/09/2026",
    notes: "Cliente menciona ruido al frenar en reversa.",
    parts: [{ name: "Filtro de aceite", qty: 1 }, { name: "Aceite de motor 5W-30", qty: 4 }],
  },
  {
    id: 2,
    plate: "MNO-7890", brand: "Nissan", model: "Sentra", year: 2022,
    client: "Luis Torres", clientPhone: "7567-8901",
    services: ["Revisión de frenos", "Alineación y balanceo"],
    servicesDone: [false, false],
    status: "Pendiente",
    receivedDate: "07/09/2026", dueDate: "10/09/2026",
    notes: "",
    parts: [],
  },
  {
    id: 3,
    plate: "RST-4444", brand: "Subaru", model: "Forester", year: 2022,
    client: "Juan Pérez", clientPhone: "7123-4567",
    services: ["Cambio de aceite y filtro", "Revisión de suspensión"],
    servicesDone: [true, true],
    status: "Finalizado",
    receivedDate: "05/09/2026", dueDate: "07/09/2026",
    notes: "Suspensión delantera derecha con holgura. Revisado.",
    parts: [{ name: "Filtro de aceite", qty: 1 }, { name: "Aceite de motor 10W-40", qty: 4 }, { name: "Amortiguador delantero", qty: 1 }],
  },
  {
    id: 4,
    plate: "JKL-3456", brand: "Chevrolet", model: "Spark", year: 2018,
    client: "Ana García", clientPhone: "7456-7890",
    services: ["Cambio de bujías", "Cambio de filtro de combustible", "Revisión general"],
    servicesDone: [false, false, false],
    status: "Pendiente",
    receivedDate: "07/09/2026", dueDate: "09/09/2026",
    notes: "Falla de encendido en frío.",
    parts: [],
  },
];

const TODAY_ORDERS = INITIAL_ORDERS.filter((o) => o.receivedDate === "07/09/2026");
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  "Pendiente":  "En Proceso",
  "En Proceso": "Finalizado",
  "Finalizado": null,
};
const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  "Pendiente":  { bg: "rgba(234,179,8,0.1)",  color: "#facc15", border: "rgba(234,179,8,0.25)" },
  "En Proceso": { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  "Finalizado": { bg: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "rgba(34,197,94,0.25)" },
};
const BTN_LABEL: Record<OrderStatus, string> = {
  "Pendiente":  "▶  Iniciar trabajo",
  "En Proceso": "✓  Marcar como Finalizado",
  "Finalizado": "✓  Completado",
};

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, dur = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    setV(0);
    const t0 = Date.now();
    function frame() {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target]);
  return v;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoDash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoClip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
const IcoBell = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoMenu = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcoWrench = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IcoCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><path d="M8 17v2"/><path d="M16 17v2"/><path d="M7 9l2-4h6l2 4"/></svg>;

type MechSection = "dashboard" | "ordenes";
const NAV = [
  { id: "dashboard" as MechSection, label: "Dashboard",    icon: <IcoDash /> },
  { id: "ordenes"   as MechSection, label: "Mis Órdenes",  icon: <IcoClip /> },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ active, onSelect, mobileOpen, onClose }: { active: MechSection; onSelect: (s: MechSection) => void; mobileOpen: boolean; onClose: () => void }) {
  const W = 200;
  const inner = (
    <div style={{ width: W, height: "100%", background: "#0D0D0F", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e22" }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 700 }}>Taller Bonilla</div>
          <div style={{ color: "#5a5a65", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mecánico</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV.map((item) => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 3, background: on ? "rgba(163,18,18,0.15)" : "transparent", color: on ? "#f0f0f2" : "#6a6a76", fontSize: 13, fontWeight: on ? 600 : 400, transition: "all 0.15s", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#c0c0c8"; } }}
              onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6a6a76"; } }}>
              <span style={{ color: on ? "#A31212" : "inherit", flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
              {on && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#A31212" }} />}
            </button>
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
      <div className="mec-sidebar-desktop" style={{ width: W, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>{inner}</div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={onClose}>
          <div className="sidebar-slide" style={{ width: W, height: "100%", zIndex: 51 }} onClick={(e) => e.stopPropagation()}>{inner}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
        </div>
      )}
    </>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ onLogout, onMenuToggle }: { onLogout: () => void; onMenuToggle: () => void }) {
  const [time, setTime] = useState(new Date());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ height: 64, background: "#161618", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
      <button className="mec-hamburger" onClick={onMenuToggle} style={{ background: "none", border: "none", color: "#8a8a96", cursor: "pointer", display: "none", alignItems: "center", padding: 4 }}><IcoMenu /></button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>Hola, Noé 👋</span>
          <span style={{ background: "#166534", color: "#4ade80", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Mecánico</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>En vivo</span>
          </div>
        </div>
      </div>

      <div className="mec-clock" style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</div>
        <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "capitalize" }}>{dateStr}</div>
      </div>

      <button style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 8, padding: "7px 8px", cursor: "pointer", color: "#8a8a96", display: "flex", alignItems: "center", transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,18,18,0.1)"; e.currentTarget.style.color = "#A31212"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
        <IcoBell />
        <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "#A31212", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
      </button>

      <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setOpen((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #166534 0%, #14532d 100%)", border: "2px solid #2a2a2e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#166534")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2e")}>
          NA
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 180, background: "#212125", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2a2e" }}>
              <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>Noé Arias</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>Mecánico</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#c0c0c8", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Mi perfil</button>
            <button onClick={() => { setOpen(false); onLogout(); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#e87070", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,18,18,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Order Card (mobile-first) ─────────────────────────────────────────────────

function OrderCard({ order, onAdvance, onOpenDetail }: { order: MechanicOrder; onAdvance: (id: number) => void; onOpenDetail: (id: number) => void }) {
  const st = STATUS_STYLE[order.status];
  const next = NEXT_STATUS[order.status];
  const donePct = order.services.length > 0 ? Math.round((order.servicesDone.filter(Boolean).length / order.services.length) * 100) : 0;

  return (
    <div style={{ background: "#212125", border: `1px solid ${order.status === "En Proceso" ? "rgba(59,130,246,0.3)" : "#2a2a2e"}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: order.status === "En Proceso" ? "0 0 20px rgba(59,130,246,0.07)" : "none", transition: "box-shadow 0.2s" }}>

      {/* Top accent stripe */}
      <div style={{ height: 3, background: order.status === "En Proceso" ? "linear-gradient(90deg,#3b82f6,#60a5fa)" : order.status === "Finalizado" ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#ca8a04,#facc15)" }} />

      <div style={{ padding: "18px 18px 14px" }}>
        {/* Header: plate + status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", fontFamily: "monospace" }}>{order.plate}</div>
            <div style={{ color: "#8a8a96", fontSize: 13, marginTop: 2 }}>{order.brand} {order.model} · {order.year}</div>
          </div>
          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{order.status}</span>
        </div>

        {/* Client */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style={{ color: "#c0c0c8", fontSize: 13, fontWeight: 500 }}>{order.client}</div>
            <div style={{ color: "#5a5a65", fontSize: 11 }}>{order.clientPhone}</div>
          </div>
        </div>

        {/* Services pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {order.services.map((s, i) => (
            <span key={i} style={{ background: order.servicesDone[i] ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: order.servicesDone[i] ? "#4ade80" : "#8a8a96", border: `1px solid ${order.servicesDone[i] ? "rgba(34,197,94,0.2)" : "transparent"}`, fontSize: 11, padding: "3px 9px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
              {order.servicesDone[i] && <span style={{ fontSize: 9 }}>✓</span>}
              {s}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        {order.status !== "Pendiente" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#5a5a65", fontSize: 11 }}>Progreso de servicios</span>
              <span style={{ color: donePct === 100 ? "#4ade80" : "#8a8a96", fontSize: 11, fontWeight: 600 }}>{donePct}%</span>
            </div>
            <div style={{ height: 5, background: "#252529", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${donePct}%`, background: donePct === 100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}

        {/* Dates */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Recibido</div>
            <div style={{ color: "#8a8a96", fontSize: 12 }}>{order.receivedDate}</div>
          </div>
          <div>
            <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Entrega est.</div>
            <div style={{ color: "#facc15", fontSize: 12, fontWeight: 600 }}>{order.dueDate}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {next && (
          <button onClick={() => onAdvance(order.id)}
            style={{ width: "100%", background: order.status === "En Proceso" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 12, padding: "14px 20px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "opacity 0.15s, transform 0.1s", letterSpacing: "-0.01em" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
            {BTN_LABEL[order.status]}
          </button>
        )}
        {order.status === "Finalizado" && (
          <div style={{ textAlign: "center", padding: "12px 0 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
            <IcoCheck /> Trabajo finalizado
          </div>
        )}
        <button onClick={() => onOpenDetail(order.id)}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 12, padding: "12px 20px", color: "#8a8a96", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#c0c0c8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
          Ver detalle completo
        </button>
      </div>
    </div>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onToggleService, onAddPart, onFinalize }: {
  order: MechanicOrder;
  onClose: () => void;
  onToggleService: (orderId: number, idx: number) => void;
  onAddPart: (orderId: number, name: string, qty: number) => void;
  onFinalize: (orderId: number) => void;
}) {
  const [selectedPart, setSelectedPart] = useState("");
  const [qty, setQty] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const st = STATUS_STYLE[order.status];
  const donePct = order.services.length > 0 ? Math.round((order.servicesDone.filter(Boolean).length / order.services.length) * 100) : 0;

  function handleAddPart() {
    if (!selectedPart) return;
    onAddPart(order.id, selectedPart, qty);
    setSelectedPart("");
    setQty(1);
  }

  function handleFinalize() {
    onFinalize(order.id);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onClose(); }, 2000);
  }

  const inputStyle = { background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 14px", fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <style>{`
        @keyframes slide-up-modal { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-slide-up { animation: slide-up-modal 0.3s cubic-bezier(0.34,1.3,0.64,1) forwards; }
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .part-row { display: flex; align-items: center; padding: 9px 14px; border-bottom: 1px solid #1e1e22; gap: 10; }
        .part-row:last-child { border-bottom: none; }
      `}</style>

      <div className="modal-slide-up" style={{ width: "100%", maxWidth: 600, background: "#212125", borderRadius: "20px 20px 0 0", border: "1px solid #2a2a2e", borderBottom: "none", boxShadow: "0 -24px 80px rgba(0,0,0,0.6)", maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {showSuccess && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: "20px 20px 0 0", gap: 16 }}>
            <div className="success-pop" style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700 }}>Orden finalizada</div>
              <div style={{ color: "#4ade80", fontSize: 14, marginTop: 4 }}>{order.plate} — {order.model}</div>
            </div>
          </div>
        )}

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#35353a" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "4px 20px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#f0f0f2", fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{order.plate}</div>
            <div style={{ color: "#8a8a96", fontSize: 13 }}>{order.brand} {order.model} · {order.year}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{order.status}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "7px 10px", color: "#8a8a96", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Vehicle + client info */}
          <div style={{ background: "#252529", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Cliente</div>
              <div style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>{order.client}</div>
              <div style={{ color: "#60a5fa", fontSize: 12 }}>{order.clientPhone}</div>
            </div>
            <div>
              <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Entrega estimada</div>
              <div style={{ color: "#facc15", fontSize: 14, fontWeight: 600 }}>{order.dueDate}</div>
              <div style={{ color: "#5a5a65", fontSize: 12 }}>Recibido: {order.receivedDate}</div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ color: "#d4b54a", fontSize: 13 }}>{order.notes}</span>
            </div>
          )}

          {/* Service checklist */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#8a8a96", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Servicios a realizar</span>
              <span style={{ color: donePct === 100 ? "#4ade80" : "#8a8a96", fontSize: 12, fontWeight: 600 }}>{order.servicesDone.filter(Boolean).length}/{order.services.length}</span>
            </div>
            <div style={{ background: "#252529", borderRadius: 12, overflow: "hidden" }}>
              {order.services.map((s, i) => {
                const done = order.servicesDone[i];
                return (
                  <button key={i} onClick={() => onToggleService(order.id, i)}
                    style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < order.services.length - 1 ? "1px solid #1e1e22" : "none", cursor: "pointer", textAlign: "left", fontFamily: "'Inter',sans-serif", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${done ? "#22c55e" : "#35353a"}`, background: done ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ color: done ? "#4ade80" : "#c0c0c8", fontSize: 14, fontWeight: done ? 500 : 400, textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1, transition: "color 0.15s" }}>{s}</span>
                  </button>
                );
              })}
            </div>
            {donePct > 0 && (
              <div style={{ marginTop: 8, height: 4, background: "#252529", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${donePct}%`, background: donePct === 100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            )}
          </div>

          {/* Parts used */}
          <div>
            <span style={{ display: "block", color: "#8a8a96", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Repuestos utilizados</span>

            {order.parts.length > 0 && (
              <div style={{ background: "#252529", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
                {order.parts.map((p, i) => (
                  <div key={i} className="part-row">
                    <span style={{ fontSize: 14, color: "#c0c0c8", flex: 1 }}>{p.name}</span>
                    <span style={{ background: "rgba(255,255,255,0.07)", color: "#8a8a96", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>x{p.qty}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add part */}
            {order.status !== "Finalizado" && (
              <div style={{ background: "#252529", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: "#5a5a65", fontSize: 12 }}>Agregar repuesto del catálogo</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <select value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)}
                      style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 32, color: selectedPart ? "#f0f0f2" : "#5a5a65" }}>
                      <option value="">Seleccionar repuesto...</option>
                      {PARTS_CATALOG.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 11 }}>▾</span>
                  </div>
                  <input type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    style={{ ...inputStyle, width: 64, textAlign: "center", flexShrink: 0 }} />
                </div>
                <button onClick={handleAddPart} disabled={!selectedPart}
                  style={{ background: selectedPart ? "rgba(163,18,18,0.12)" : "transparent", border: `1px solid ${selectedPart ? "rgba(163,18,18,0.35)" : "#2a2a2e"}`, borderRadius: 8, padding: "10px 16px", color: selectedPart ? "#f87171" : "#5a5a65", fontSize: 13, fontWeight: 600, cursor: selectedPart ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", transition: "all .2s" }}
                  onMouseEnter={(e) => { if (selectedPart) { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = selectedPart ? "rgba(163,18,18,0.12)" : "transparent"; (e.currentTarget as HTMLButtonElement).style.color = selectedPart ? "#f87171" : "#5a5a65"; }}>
                  + Agregar al registro
                </button>
              </div>
            )}
          </div>

          {/* Finalize CTA */}
          {order.status === "En Proceso" && (
            <button onClick={handleFinalize}
              style={{ width: "100%", background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", letterSpacing: "-0.01em", transition: "opacity 0.15s, transform 0.1s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
              ✓  Marcar como Finalizado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Home ────────────────────────────────────────────────────────────

function MechHome({ orders, onAdvance, onOpenDetail }: { orders: MechanicOrder[]; onAdvance: (id: number) => void; onOpenDetail: (id: number) => void }) {
  const assignedToday   = TODAY_ORDERS.length;
  const inProcess       = orders.filter((o) => o.status === "En Proceso").length;
  const completedWeek   = orders.filter((o) => o.status === "Finalizado").length;
  const activeOrders    = orders.filter((o) => o.status !== "Finalizado");
  const finishedOrders  = orders.filter((o) => o.status === "Finalizado");

  const c1 = useCountUp(assignedToday);
  const c2 = useCountUp(inProcess);
  const c3 = useCountUp(completedWeek);

  const kpiIcon = (path: JSX.Element) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      <style>{`
        .mec-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .mec-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        @media (max-width: 700px) { .mec-kpis { grid-template-columns: repeat(3,1fr); gap: 10px; } }
        @media (max-width: 480px) { .mec-kpis { grid-template-columns: 1fr; } .mec-cards { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Resumen del día — Noé Arias</p>
      </div>

      {/* KPI Cards */}
      <div className="mec-kpis">
        {[
          { label: "Asignadas hoy",    count: c1, color: "#A31212",  icon: kpiIcon(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>) },
          { label: "En proceso",       count: c2, color: "#3b82f6",  icon: kpiIcon(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>) },
          { label: "Finalizadas",      count: c3, color: "#22c55e",  icon: kpiIcon(<><polyline points="20 6 9 17 4 12"/></>) },
        ].map((k) => (
          <div key={k.label}
            style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow 0.2s, transform 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(163,18,18,0.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ color: "#8a8a96", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
            </div>
            <div style={{ color: "#f0f0f2", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.count}</div>
          </div>
        ))}
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>
            Órdenes activas
            <span style={{ marginLeft: 8, background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{activeOrders.length}</span>
          </h2>
          <div className="mec-cards">
            {activeOrders.map((o) => <OrderCard key={o.id} order={o} onAdvance={onAdvance} onOpenDetail={onOpenDetail} />)}
          </div>
        </div>
      )}

      {/* Finished orders */}
      {finishedOrders.length > 0 && (
        <div>
          <h2 style={{ color: "#5a5a65", fontSize: 14, fontWeight: 600, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Finalizadas esta semana
          </h2>
          <div className="mec-cards">
            {finishedOrders.map((o) => <OrderCard key={o.id} order={o} onAdvance={onAdvance} onOpenDetail={onOpenDetail} />)}
          </div>
        </div>
      )}

      {activeOrders.length === 0 && finishedOrders.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#5a5a65" }}>
          <IcoCar />
          <div style={{ marginTop: 12, fontSize: 14 }}>No hay órdenes asignadas por ahora.</div>
        </div>
      )}
    </div>
  );
}

// ── Mis Órdenes (full list) ───────────────────────────────────────────────────

function MisOrdenes({ orders, onAdvance, onOpenDetail }: { orders: MechanicOrder[]; onAdvance: (id: number) => void; onOpenDetail: (id: number) => void }) {
  const [filter, setFilter] = useState<"Todas" | OrderStatus>("Todas");

  const filtered = filter === "Todas" ? orders : orders.filter((o) => o.status === filter);

  const tabs: { label: string; value: "Todas" | OrderStatus }[] = [
    { label: "Todas",      value: "Todas" },
    { label: "Pendiente",  value: "Pendiente" },
    { label: "En Proceso", value: "En Proceso" },
    { label: "Finalizado", value: "Finalizado" },
  ];
  const TAB_COLOR: Record<string, string> = { "Pendiente": "#facc15", "En Proceso": "#60a5fa", "Finalizado": "#4ade80", "Todas": "#A31212" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <style>{`.ord-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; } @media (max-width: 480px) { .ord-cards { grid-template-columns: 1fr; } }`}</style>

      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Mis Órdenes</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{orders.length} órdenes asignadas a ti</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const on = filter === t.value;
          const cnt = t.value === "Todas" ? orders.length : orders.filter((o) => o.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setFilter(t.value)}
              style={{ background: on ? `${TAB_COLOR[t.value]}18` : "rgba(255,255,255,0.04)", border: `1.5px solid ${on ? TAB_COLOR[t.value] + "50" : "#2a2a2e"}`, borderRadius: 8, padding: "7px 14px", color: on ? TAB_COLOR[t.value] : "#6a6a76", fontSize: 13, fontWeight: on ? 600 : 400, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}>
              {t.label}
              <span style={{ background: on ? `${TAB_COLOR[t.value]}30` : "rgba(255,255,255,0.07)", color: on ? TAB_COLOR[t.value] : "#5a5a65", fontSize: 11, fontWeight: 700, padding: "0px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#5a5a65", fontSize: 13 }}>No hay órdenes en este estado.</div>
      ) : (
        <div className="ord-cards">
          {filtered.map((o) => <OrderCard key={o.id} order={o} onAdvance={onAdvance} onOpenDetail={onOpenDetail} />)}
        </div>
      )}
    </div>
  );
}

// ── MechanicDashboard ─────────────────────────────────────────────────────────

interface Props { session: Session; onLogout: () => void; }

export default function MechanicDashboard({ onLogout }: Props) {
  const [section, setSection]     = useState<MechSection>("dashboard");
  const [sidebarOpen, setSidebar] = useState(false);
  const [orders, setOrders]       = useState<MechanicOrder[]>(INITIAL_ORDERS);
  const [detailId, setDetailId]   = useState<number | null>(null);

  function advanceStatus(id: number) {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const next = NEXT_STATUS[o.status];
      return next ? { ...o, status: next } : o;
    }));
  }

  function toggleService(orderId: number, idx: number) {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const servicesDone = [...o.servicesDone];
      servicesDone[idx] = !servicesDone[idx];
      return { ...o, servicesDone };
    }));
  }

  function addPart(orderId: number, name: string, qty: number) {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const existing = o.parts.findIndex((p) => p.name === name);
      if (existing >= 0) {
        const parts = [...o.parts];
        parts[existing] = { ...parts[existing], qty: parts[existing].qty + qty };
        return { ...o, parts };
      }
      return { ...o, parts: [...o.parts, { name, qty }] };
    }));
  }

  function finalizeOrder(id: number) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "Finalizado" } : o));
  }

  const detailOrder = orders.find((o) => o.id === detailId) ?? null;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", background: "#1C1C1F", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .mec-sidebar-desktop { display: none !important; }
          .mec-hamburger { display: flex !important; }
          .mec-clock { display: none !important; }
        }
      `}</style>

      <Sidebar active={section} onSelect={setSection} mobileOpen={sidebarOpen} onClose={() => setSidebar(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar onLogout={onLogout} onMenuToggle={() => setSidebar((v) => !v)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {section === "dashboard" && <MechHome orders={orders} onAdvance={advanceStatus} onOpenDetail={setDetailId} />}
          {section === "ordenes"   && <MisOrdenes orders={orders} onAdvance={advanceStatus} onOpenDetail={setDetailId} />}
        </main>
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailId(null)}
          onToggleService={toggleService}
          onAddPart={addPart}
          onFinalize={finalizeOrder}
        />
      )}
    </div>
  );
}
