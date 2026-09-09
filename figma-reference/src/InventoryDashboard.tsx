import { useState, useEffect, useRef } from "react";
import { Session } from "./App";
import logoImg from "@/imports/Logo.png";

// ── Data ──────────────────────────────────────────────────────────────────────

interface Supplier {
  id: number;
  name: string;
  phone: string;
}

interface Part {
  id: number;
  code: string;
  name: string;
  supplierId: number;
  stock: number;
  minStock: number;
  price: number; // CLP unit price
}

interface StockLog {
  partId: number;
  type: "entrada" | "salida";
  qty: number;
  reason: string;
  date: string;
}

const SEED_SUPPLIERS: Supplier[] = [
  { id: 1, name: "AutoPartes Nacional S.A.",  phone: "2234-5678" },
  { id: 2, name: "Distribuidora Oriente",      phone: "2345-6789" },
  { id: 3, name: "Repuestos San Miguel",        phone: "2456-7890" },
  { id: 4, name: "TechAuto Imports",            phone: "2567-8901" },
  { id: 5, name: "Lubricantes El Salvador",     phone: "2678-9012" },
];

const SEED_PARTS: Part[] = [
  { id:  1, code: "FIL-001", name: "Filtro de aceite",             supplierId: 1, stock:  8, minStock: 10, price:  4500  },
  { id:  2, code: "FIL-002", name: "Filtro de aire",               supplierId: 1, stock: 14, minStock:  8, price:  6200  },
  { id:  3, code: "FIL-003", name: "Filtro de combustible",        supplierId: 1, stock:  3, minStock:  6, price:  7800  },
  { id:  4, code: "FRE-001", name: "Pastillas freno delanteras",   supplierId: 2, stock: 12, minStock:  8, price: 28000  },
  { id:  5, code: "FRE-002", name: "Pastillas freno traseras",     supplierId: 2, stock:  5, minStock:  6, price: 22000  },
  { id:  6, code: "FRE-003", name: "Disco de freno",               supplierId: 2, stock:  4, minStock:  4, price: 48000  },
  { id:  7, code: "ENC-001", name: "Bujías (x4)",                  supplierId: 3, stock: 20, minStock: 10, price: 12500  },
  { id:  8, code: "ENC-002", name: "Bobina de encendido",          supplierId: 3, stock:  2, minStock:  4, price: 65000  },
  { id:  9, code: "ENC-003", name: "Sensor de oxígeno",            supplierId: 4, stock:  3, minStock:  3, price: 85000  },
  { id: 10, code: "LUB-001", name: "Aceite motor 5W-30 (1L)",      supplierId: 5, stock: 32, minStock: 20, price:  8900  },
  { id: 11, code: "LUB-002", name: "Aceite motor 10W-40 (1L)",     supplierId: 5, stock: 28, minStock: 20, price:  7800  },
  { id: 12, code: "LUB-003", name: "Refrigerante (1L)",            supplierId: 5, stock:  7, minStock: 10, price:  5500  },
  { id: 13, code: "LUB-004", name: "Líquido de frenos (500ml)",    supplierId: 5, stock: 11, minStock:  8, price:  4200  },
  { id: 14, code: "SUS-001", name: "Amortiguador delantero",       supplierId: 2, stock:  3, minStock:  4, price:125000  },
  { id: 15, code: "SUS-002", name: "Amortiguador trasero",         supplierId: 2, stock:  2, minStock:  4, price:110000  },
  { id: 16, code: "TRA-001", name: "Correa de distribución",       supplierId: 3, stock:  6, minStock:  4, price: 38000  },
  { id: 17, code: "TRA-002", name: "Correa serpentina",            supplierId: 3, stock:  5, minStock:  4, price: 22000  },
  { id: 18, code: "ELE-001", name: "Batería 12V 55Ah",             supplierId: 4, stock:  4, minStock:  3, price:185000  },
  { id: 19, code: "ELE-002", name: "Termostato",                   supplierId: 4, stock:  1, minStock:  3, price: 28000  },
  { id: 20, code: "ELE-003", name: "Relay de arranque",            supplierId: 4, stock:  6, minStock:  4, price:  9500  },
];

// Monthly usage for chart (top 7 parts by name)
const MONTHLY_USAGE = [
  { name: "Filtro de aceite",    used: 34 },
  { name: "Aceite 5W-30",        used: 28 },
  { name: "Bujías",              used: 22 },
  { name: "Pastillas del.",      used: 18 },
  { name: "Filtro de aire",      used: 15 },
  { name: "Refrigerante",        used: 12 },
  { name: "Líquido frenos",      used:  9 },
];

function stockStatus(p: Part): "ok" | "low" | "critical" {
  if (p.stock <= 0) return "critical";
  if (p.stock < p.minStock) return p.stock <= Math.ceil(p.minStock * 0.4) ? "critical" : "low";
  return "ok";
}

const STATUS_STYLE = {
  ok:       { bg: "rgba(34,197,94,0.1)",  color: "#4ade80",  border: "rgba(34,197,94,0.25)",  label: "OK" },
  low:      { bg: "rgba(234,179,8,0.1)",  color: "#facc15",  border: "rgba(234,179,8,0.25)",  label: "Stock bajo" },
  critical: { bg: "rgba(239,68,68,0.1)",  color: "#f87171",  border: "rgba(239,68,68,0.25)",  label: "Crítico" },
};

function fmtPrice(n: number) { return `$${Math.round(n).toLocaleString("es-CL")}`; }

// ── Count-up ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 1200) {
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
const IcoDash   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoBox    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoTruck  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IcoBell   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoMenu   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;

type InvSection = "dashboard" | "repuestos" | "proveedores";
const NAV = [
  { id: "dashboard"  as InvSection, label: "Dashboard",   icon: <IcoDash /> },
  { id: "repuestos"  as InvSection, label: "Repuestos",   icon: <IcoBox /> },
  { id: "proveedores"as InvSection, label: "Proveedores", icon: <IcoTruck /> },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onSelect, mobileOpen, onClose }: { active: InvSection; onSelect: (s: InvSection) => void; mobileOpen: boolean; onClose: () => void }) {
  const W = 200;
  const inner = (
    <div style={{ width: W, height: "100%", background: "#0D0D0F", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e22" }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 700 }}>Taller Bonilla</div>
          <div style={{ color: "#5a5a65", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Inventario</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV.map((item) => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 3, background: on ? "rgba(139,92,246,0.15)" : "transparent", color: on ? "#f0f0f2" : "#6a6a76", fontSize: 13, fontWeight: on ? 600 : 400, transition: "all 0.15s", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#c0c0c8"; } }}
              onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6a6a76"; } }}>
              <span style={{ color: on ? "#a78bfa" : "inherit", flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
              {on && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }} />}
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
      <div className="inv-sidebar-desktop" style={{ width: W, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>{inner}</div>
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
function TopBar({ onLogout, onMenuToggle, criticalCount }: { onLogout: () => void; onMenuToggle: () => void; criticalCount: number }) {
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
      <button className="inv-hamburger" onClick={onMenuToggle} style={{ background: "none", border: "none", color: "#8a8a96", cursor: "pointer", display: "none", alignItems: "center", padding: 4 }}><IcoMenu /></button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>Hola, José Luis 👋</span>
          <span style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Inventario</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>En vivo</span>
          </div>
        </div>
      </div>
      <div className="inv-clock" style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</div>
        <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "capitalize" }}>{dateStr}</div>
      </div>
      <button style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 8, padding: "7px 8px", cursor: "pointer", color: "#8a8a96", display: "flex", alignItems: "center", transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,18,18,0.1)"; e.currentTarget.style.color = "#A31212"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
        <IcoBell />
        {criticalCount > 0 && <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{criticalCount}</span>}
      </button>
      <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setOpen((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", border: "2px solid #2a2a2e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2e")}>
          JL
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 185, background: "#212125", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2a2e" }}>
              <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>José Luis Rodas</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>Inventario</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#c0c0c8", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Mi perfil</button>
            <button onClick={() => { setOpen(false); onLogout(); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#e87070", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,18,18,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────
function StockModal({ part, suppliers, onClose, onSave }: {
  part: Part;
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (partId: number, type: "entrada" | "salida", qty: number, reason: string) => void;
}) {
  const [type, setType]     = useState<"entrada" | "salida">("entrada");
  const [qty, setQty]       = useState(1);
  const [reason, setReason] = useState("");
  const [done, setDone]     = useState(false);
  const sup = suppliers.find((s) => s.id === part.supplierId);

  function handleSave() {
    if (qty < 1 || !reason.trim()) return;
    onSave(part.id, type, qty, reason.trim());
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <style>{`
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 440, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: type === "entrada" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `2px solid ${type === "entrada" ? "#22c55e" : "#ef4444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={type === "entrada" ? "#22c55e" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Movimiento registrado</div>
              <div style={{ color: type === "entrada" ? "#4ade80" : "#f87171", fontSize: 13, marginTop: 4 }}>{type === "entrada" ? "+" : "-"}{qty} unidades · {part.name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Ajustar stock</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>{part.code} · {part.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Current stock info */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Stock actual</div>
              <div style={{ color: "#f0f0f2", fontSize: 22, fontWeight: 800 }}>{part.stock}</div>
            </div>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Mínimo</div>
              <div style={{ color: "#facc15", fontSize: 22, fontWeight: 800 }}>{part.minStock}</div>
            </div>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Proveedor</div>
              <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>{sup?.name ?? "—"}</div>
            </div>
          </div>

          {/* Type toggle */}
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tipo de movimiento</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["entrada", "salida"] as const).map((t) => {
                const on = type === t;
                const col = t === "entrada" ? "#22c55e" : "#f87171";
                return (
                  <button key={t} onClick={() => setType(t)}
                    style={{ flex: 1, background: on ? (t === "entrada" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "#252529", border: `1.5px solid ${on ? col + "50" : "#35353a"}`, borderRadius: 10, padding: "12px 10px", cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                    <span style={{ fontSize: 18 }}>{t === "entrada" ? "📦" : "📤"}</span>
                    <span style={{ color: on ? col : "#8a8a96", fontSize: 13, fontWeight: on ? 700 : 400, textTransform: "capitalize" }}>{t}</span>
                    <span style={{ color: "#5a5a65", fontSize: 10 }}>{t === "entrada" ? "Compra / recepción" : "Uso / merma"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cantidad</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="db-input" style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }} />
          </div>

          {/* Reason */}
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Motivo</label>
            <input type="text" placeholder={type === "entrada" ? "Ej: Compra a proveedor, reposición..." : "Ej: Uso en orden ORD-0003, pieza dañada..."}
              value={reason} onChange={(e) => setReason(e.target.value)} className="db-input" />
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancelar</button>
          <button onClick={handleSave} disabled={qty < 1 || !reason.trim()}
            style={{ background: qty >= 1 && reason.trim() ? (type === "entrada" ? "#166534" : "#991b1b") : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: qty >= 1 && reason.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", opacity: qty >= 1 && reason.trim() ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (qty >= 1 && reason.trim()) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}>
            Registrar movimiento
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Part Modal ────────────────────────────────────────────────────────────
const BLANK_PART = { code: "", name: "", supplierId: 0, stock: 0, minStock: 0, price: 0 };

function NewPartModal({ suppliers, onClose, onSave }: {
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (p: Omit<Part, "id">) => void;
}) {
  const [form, setForm] = useState({ ...BLANK_PART, supplierId: suppliers[0]?.id ?? 0 });
  const [done, setDone] = useState(false);
  const valid = form.code.trim() && form.name.trim() && form.supplierId > 0;

  function handleSave() {
    if (!valid) return;
    onSave({ ...form });
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  const label = (t: string) => <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{t}</label>;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 520, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid #a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Repuesto registrado</div>
              <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 4 }}>{form.code} · {form.name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Nuevo Repuesto</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Agregar al catálogo de inventario</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              {label("Código")}
              <input className="db-input" placeholder="FIL-021" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              {label("Nombre del repuesto")}
              <input className="db-input" placeholder="Ej: Filtro de aceite premium" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>

          <div>
            {label("Proveedor")}
            <div style={{ position: "relative" }}>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: Number(e.target.value) }))} className="db-select">
                <option value={0} disabled>Seleccionar proveedor...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 11 }}>▾</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              {label("Stock inicial")}
              <input type="number" min={0} className="db-input" placeholder="0" value={form.stock || ""} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
            <div>
              {label("Stock mínimo")}
              <input type="number" min={1} className="db-input" placeholder="5" value={form.minStock || ""} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
            <div>
              {label("Precio unit. ($)")}
              <input type="number" min={0} className="db-input" placeholder="0" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancelar</button>
          <button onClick={handleSave} disabled={!valid}
            style={{ background: valid ? "#7c3aed" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", opacity: valid ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (valid) (e.currentTarget as HTMLButtonElement).style.background = "#6d28d9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = valid ? "#7c3aed" : "#35353a"; }}>
            Guardar repuesto
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Supplier Modal ────────────────────────────────────────────────────────
function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, phone: string) => void }) {
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone]   = useState(false);
  const valid = name.trim();

  function handleSave() {
    if (!valid) return;
    onSave(name.trim(), phone.trim());
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 420, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid #a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Proveedor registrado</div>
              <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 4 }}>{name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Nuevo Proveedor</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Registrar en el sistema</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre del proveedor *</label>
            <input className="db-input" placeholder="Ej: Repuestos El Centro S.A." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Teléfono</label>
            <input className="db-input" placeholder="Ej: 2234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancelar</button>
          <button onClick={handleSave} disabled={!valid}
            style={{ background: valid ? "#7c3aed" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", opacity: valid ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (valid) (e.currentTarget as HTMLButtonElement).style.background = "#6d28d9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = valid ? "#7c3aed" : "#35353a"; }}>
            Guardar proveedor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function UsageChart() {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(...MONTHLY_USAGE.map((d) => d.used), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {MONTHLY_USAGE.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 }}>
            {hov === i && <span style={{ fontSize: 9, fontWeight: 700, color: "#f0f0f2", background: "#2a2a2e", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" }}>{d.used} uds.</span>}
            <div
              style={{ width: "100%", height: `${(d.used / max) * 100}%`, background: hov === i ? "linear-gradient(180deg,#9333ea,#7c3aed)" : "linear-gradient(180deg,#7c3aed,#5b21b6)", borderRadius: "4px 4px 0 0", cursor: "pointer", transition: "all 0.2s", boxShadow: hov === i ? "0 0 12px rgba(139,92,246,0.5)" : "none", minHeight: 4 }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {MONTHLY_USAGE.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 9, color: hov === i ? "#f0f0f2" : "#5a5a65", transition: "color 0.2s", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard Home ────────────────────────────────────────────────────────────
function InvHome({ parts, suppliers, onAdjust }: { parts: Part[]; suppliers: Supplier[]; onAdjust: (id: number) => void }) {
  const totalParts    = parts.length;
  const lowStock      = parts.filter((p) => stockStatus(p) !== "ok").length;
  const totalValue    = parts.reduce((a, p) => a + p.stock * p.price, 0);
  const activeSup     = suppliers.length;
  const criticals     = parts.filter((p) => stockStatus(p) !== "ok").sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock));

  const c1 = useCountUp(totalParts);
  const c2 = useCountUp(lowStock);
  const c3 = useCountUp(Math.round(totalValue / 1000));
  const c4 = useCountUp(activeSup);

  const kpis = [
    { label: "Repuestos totales",     value: c1,  suffix: "",   color: "#a78bfa", warn: false, icon: <IcoBox /> },
    { label: "Stock bajo / crítico",  value: c2,  suffix: "",   color: "#f87171", warn: true,  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { label: "Valor del inventario",  value: c3,  suffix: "k",  color: "#4ade80", warn: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label: "Proveedores activos",   value: c4,  suffix: "",   color: "#60a5fa", warn: false, icon: <IcoTruck /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 }}>
      <style>{`
        .inv-kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .inv-mid  { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
        .inv-card { background: #212125; border: 1px solid #2a2a2e; border-radius: 14px; padding: 20px; }
        @media (max-width: 1100px) { .inv-mid { grid-template-columns: 1fr; } }
        @media (max-width: 700px)  { .inv-kpis { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 420px)  { .inv-kpis { grid-template-columns: 1fr; } }
      `}</style>

      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Control de inventario — Taller Bonilla</p>
      </div>

      {/* KPIs */}
      <div className="inv-kpis">
        {kpis.map((k, i) => (
          <div key={k.label}
            style={{ background: k.warn && k.value > 0 ? "rgba(239,68,68,0.05)" : "#212125", border: `1px solid ${k.warn && k.value > 0 ? "rgba(239,68,68,0.25)" : "#2a2a2e"}`, borderRadius: 14, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
            className={`kpi-${i + 1}`}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(139,92,246,0.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ color: "#8a8a96", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
              <span style={{ color: k.warn && k.value > 0 ? "#ef4444" : k.color, opacity: 0.8 }}>{k.icon}</span>
            </div>
            <div style={{ color: k.warn && k.value > 0 ? "#f87171" : "#f0f0f2", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {k.suffix === "k" ? `$${k.value}k` : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Critical + chart */}
      <div className="inv-mid">
        {/* Critical stock table */}
        <div className="inv-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>Stock crítico / bajo</h2>
            <span style={{ background: criticals.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.1)", color: criticals.length > 0 ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
              {criticals.length} {criticals.length === 1 ? "repuesto" : "repuestos"}
            </span>
          </div>
          {criticals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#5a5a65", fontSize: 13 }}>✓ Todo el inventario está en niveles adecuados.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {criticals.map((p) => {
                const st = stockStatus(p);
                const pct = Math.min(100, Math.round((p.stock / p.minStock) * 100));
                const sup = suppliers.find((s) => s.id === p.supplierId);
                return (
                  <div key={p.id} style={{ background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: "#5a5a65", fontSize: 11, marginTop: 1 }}>{p.code} · {sup?.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: STATUS_STYLE[st].color, fontSize: 13, fontWeight: 700 }}>{p.stock}</span>
                        <span style={{ color: "#5a5a65", fontSize: 11 }}>/ {p.minStock} mín.</span>
                        <button onClick={() => onAdjust(p.id)}
                          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 6, padding: "4px 10px", color: "#a78bfa", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s", whiteSpace: "nowrap" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa"; }}>
                          Ajustar
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "#1e1e22", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: st === "critical" ? "linear-gradient(90deg,#ef4444,#dc2626)" : "linear-gradient(90deg,#eab308,#ca8a04)", borderRadius: 4, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ marginTop: 4, color: "#5a5a65", fontSize: 10 }}>{pct}% del mínimo requerido</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage chart */}
        <div className="inv-card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 18px" }}>Más utilizados este mes</h2>
          <UsageChart />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {MONTHLY_USAGE.slice(0, 4).map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#8a8a96", fontSize: 12 }}>{d.name}</span>
                <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>{d.used} uds.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Repuestos View ────────────────────────────────────────────────────────────
function RepuestosView({ parts, suppliers, onAdjust, onAddPart }: {
  parts: Part[];
  suppliers: Supplier[];
  onAdjust: (id: number) => void;
  onAddPart: () => void;
}) {
  const [filterSup, setFilterSup]   = useState("Todos");
  const [filterSt,  setFilterSt]    = useState("Todos");
  const [search, setSearch]         = useState("");

  const filtered = parts.filter((p) => {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    const matchSup = filterSup === "Todos" || String(p.supplierId) === filterSup;
    const matchSt  = filterSt === "Todos" || stockStatus(p) === filterSt;
    const matchQ   = `${p.code} ${p.name} ${sup?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchSup && matchSt && matchQ;
  });

  const selStyle: React.CSSProperties = { background: "#252529", border: "1px solid #35353a", color: "#c0c0c8", borderRadius: 7, padding: "7px 28px 7px 10px", fontSize: 12, fontFamily: "'Inter',sans-serif", outline: "none", appearance: "none", cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1300, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .rp-table { width: 100%; border-collapse: collapse; }
        .rp-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .rp-table td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .rp-table tr:last-child td { border-bottom: none; }
        .rp-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .adj-btn { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; padding: 5px 11px; color: #a78bfa; font-size: 11px; font-weight: 600; cursor: pointer; font-family: "Inter",sans-serif; transition: all .15s; white-space: nowrap; }
        .adj-btn:hover { background: #7c3aed; color: #fff; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Repuestos</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{parts.length} repuestos en catálogo</p>
        </div>
        <button onClick={onAddPart}
          style={{ background: "#7c3aed", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#6d28d9"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(139,92,246,.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          + Nuevo Repuesto
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e22", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", maxWidth: 260, flex: 1 }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="db-input" placeholder="Buscar por código, nombre o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 12 }} />
          </div>
          <div style={{ position: "relative" }}>
            <select style={selStyle} value={filterSup} onChange={(e) => setFilterSup(e.target.value)}>
              <option value="Todos">Todos los proveedores</option>
              {suppliers.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
          </div>
          <div style={{ position: "relative" }}>
            <select style={selStyle} value={filterSt} onChange={(e) => setFilterSt(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              <option value="ok">OK</option>
              <option value="low">Stock bajo</option>
              <option value="critical">Crítico</option>
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
          </div>
          {(filterSup !== "Todos" || filterSt !== "Todos" || search) && (
            <button onClick={() => { setFilterSup("Todos"); setFilterSt("Todos"); setSearch(""); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #35353a", borderRadius: 6, padding: "5px 10px", color: "#8a8a96", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
              Limpiar
            </button>
          )}
          <span style={{ marginLeft: "auto", color: "#5a5a65", fontSize: 12 }}>{filtered.length} resultados</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="rp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Proveedor</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Precio unit.</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>No hay repuestos que coincidan.</td></tr>
              )}
              {filtered.map((p) => {
                const st  = stockStatus(p);
                const ss  = STATUS_STYLE[st];
                const sup = suppliers.find((s) => s.id === p.supplierId);
                const pct = Math.min(100, Math.round((p.stock / p.minStock) * 100));
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "monospace", color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>{p.code}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: "#8a8a96", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sup?.name ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: ss.color, fontWeight: 700, fontSize: 14, minWidth: 24 }}>{p.stock}</span>
                        <div style={{ width: 48, height: 4, background: "#1e1e22", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: st === "ok" ? "#22c55e" : st === "low" ? "#eab308" : "#ef4444", borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#6a6a76" }}>{p.minStock}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 600 }}>{fmtPrice(p.price)}</td>
                    <td>
                      <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{ss.label}</span>
                    </td>
                    <td><button className="adj-btn" onClick={() => onAdjust(p.id)}>Ajustar stock</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e22", display: "flex", justifyContent: "flex-end", gap: 20 }}>
            <span style={{ color: "#5a5a65", fontSize: 12 }}>Valor total filtrado: <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmtPrice(filtered.reduce((a, p) => a + p.stock * p.price, 0))}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Proveedores View ──────────────────────────────────────────────────────────
function ProveedoresView({ suppliers, parts, onAddSupplier }: {
  suppliers: Supplier[];
  parts: Part[];
  onAddSupplier: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .pv-table { width: 100%; border-collapse: collapse; }
        .pv-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .pv-table td { padding: 14px 16px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .pv-table tr:last-child td { border-bottom: none; }
        .pv-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Proveedores</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{suppliers.length} proveedores registrados</p>
        </div>
        <button onClick={onAddSupplier}
          style={{ background: "#7c3aed", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#6d28d9"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(139,92,246,.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          + Nuevo Proveedor
        </button>
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="pv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Repuestos suministrados</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => {
                const count = parts.filter((p) => p.supplierId === s.id).length;
                return (
                  <tr key={s.id}>
                    <td style={{ color: "#5a5a65", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IcoTruck />
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.phone || "—"}</td>
                    <td>
                      <span style={{ background: count > 0 ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.05)", color: count > 0 ? "#a78bfa" : "#5a5a65", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                        {count} {count === 1 ? "repuesto" : "repuestos"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── InventoryDashboard ────────────────────────────────────────────────────────
interface Props { session: Session; onLogout: () => void; }

let _nextPartId = SEED_PARTS.length + 1;
let _nextSupId  = SEED_SUPPLIERS.length + 1;

export default function InventoryDashboard({ onLogout }: Props) {
  const [section, setSection]         = useState<InvSection>("dashboard");
  const [sidebarOpen, setSidebar]     = useState(false);
  const [parts, setParts]             = useState<Part[]>(SEED_PARTS);
  const [suppliers, setSuppliers]     = useState<Supplier[]>(SEED_SUPPLIERS);
  const [adjustId, setAdjustId]       = useState<number | null>(null);
  const [showNewPart, setShowNewPart] = useState(false);
  const [showNewSup,  setShowNewSup]  = useState(false);
  const [logs, setLogs]               = useState<StockLog[]>([]);

  const criticalCount = parts.filter((p) => stockStatus(p) === "critical").length;

  function handleAdjust(partId: number, type: "entrada" | "salida", qty: number, reason: string) {
    setParts((prev) => prev.map((p) => {
      if (p.id !== partId) return p;
      const delta = type === "entrada" ? qty : -qty;
      return { ...p, stock: Math.max(0, p.stock + delta) };
    }));
    setLogs((prev) => [{ partId, type, qty, reason, date: "07/09/2026" }, ...prev]);
  }

  function handleAddPart(data: Omit<Part, "id">) {
    setParts((prev) => [...prev, { id: _nextPartId++, ...data }]);
  }

  function handleAddSupplier(name: string, phone: string) {
    setSuppliers((prev) => [...prev, { id: _nextSupId++, name, phone }]);
  }

  const adjustPart = parts.find((p) => p.id === adjustId) ?? null;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", background: "#1C1C1F", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .inv-sidebar-desktop { display: none !important; }
          .inv-hamburger { display: flex !important; }
          .inv-clock { display: none !important; }
        }
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      <Sidebar active={section} onSelect={setSection} mobileOpen={sidebarOpen} onClose={() => setSidebar(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar onLogout={onLogout} onMenuToggle={() => setSidebar((v) => !v)} criticalCount={criticalCount} />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {section === "dashboard"   && <InvHome parts={parts} suppliers={suppliers} onAdjust={(id) => { setAdjustId(id); }} />}
          {section === "repuestos"   && <RepuestosView parts={parts} suppliers={suppliers} onAdjust={setAdjustId} onAddPart={() => setShowNewPart(true)} />}
          {section === "proveedores" && <ProveedoresView suppliers={suppliers} parts={parts} onAddSupplier={() => setShowNewSup(true)} />}
        </main>
      </div>

      {adjustPart && (
        <StockModal part={adjustPart} suppliers={suppliers} onClose={() => setAdjustId(null)} onSave={(id, type, qty, reason) => { handleAdjust(id, type, qty, reason); }} />
      )}
      {showNewPart && (
        <NewPartModal suppliers={suppliers} onClose={() => setShowNewPart(false)} onSave={handleAddPart} />
      )}
      {showNewSup && (
        <NewSupplierModal onClose={() => setShowNewSup(false)} onSave={handleAddSupplier} />
      )}
    </div>
  );
}
