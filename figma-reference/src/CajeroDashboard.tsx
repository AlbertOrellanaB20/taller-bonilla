import { useState, useEffect, useRef } from "react";
import { Session } from "./App";
import { Invoice, ReadyOrder, Client, Vehicle, ServiceOrder, PayMethod, SEED_INVOICES, SEED_READY_ORDERS, SEED_CLIENTS, SEED_VEHICLES, SEED_SERVICE_ORDERS, nextInvoiceNumber, calcIva, calcTotal, fmtCLP, TODAY } from "./cajeroData";
import CajeroHome from "./CajeroHome";
import CajeroFacturacion from "./CajeroFacturacion";
import CajeroClientes from "./CajeroClientes";
import CajeroVehiculos from "./CajeroVehiculos";
import CajeroOrdenes from "./CajeroOrdenes";
import logoImg from "@/imports/Logo.png";

type CajSection = "dashboard" | "clientes" | "vehiculos" | "ordenes" | "facturacion";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconDashboard() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconUsers() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconCar() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><path d="M8 17v2"/><path d="M16 17v2"/><path d="M7 9l2-4h6l2 4"/></svg>; }
function IconClipboard() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>; }
function IconReceipt() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>; }
function IconBell() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconMenu() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }

const NAV: { id: CajSection; label: string; icon: JSX.Element }[] = [
  { id: "dashboard",   label: "Dashboard",           icon: <IconDashboard /> },
  { id: "clientes",    label: "Clientes",             icon: <IconUsers /> },
  { id: "vehiculos",   label: "Vehículos",            icon: <IconCar /> },
  { id: "ordenes",     label: "Órdenes de Servicio",  icon: <IconClipboard /> },
  { id: "facturacion", label: "Facturación",          icon: <IconReceipt /> },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onSelect, mobileOpen, onClose }: { active: CajSection; onSelect: (s: CajSection) => void; mobileOpen: boolean; onClose: () => void }) {
  const W = 210;
  const inner = (
    <div style={{ width: W, height: "100%", background: "#0D0D0F", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e22" }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 700 }}>Taller Bonilla</div>
          <div style={{ color: "#5a5a65", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Secretario/a</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV.map((item) => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: on ? "rgba(163,18,18,0.15)" : "transparent", color: on ? "#f0f0f2" : "#6a6a76", fontSize: 13, fontWeight: on ? 600 : 400, transition: "all 0.15s", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#c0c0c8"; } }}
              onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6a6a76"; } }}>
              <span style={{ color: on ? "#A31212" : "inherit", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              {on && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#A31212", flexShrink: 0 }} />}
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
      <div className="caj-sidebar-desktop" style={{ width: W, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>{inner}</div>
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
      <button className="caj-hamburger" onClick={onMenuToggle} style={{ background: "none", border: "none", color: "#8a8a96", cursor: "pointer", display: "none", alignItems: "center", padding: 4 }}><IconMenu /></button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#f0f0f2", fontSize: 14, fontWeight: 600 }}>Hola, Emely 👋</span>
          <span style={{ background: "#1d4ed8", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Secretario/a</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>En vivo</span>
          </div>
        </div>
      </div>

      <div className="caj-clock" style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</div>
        <div style={{ color: "#5a5a65", fontSize: 10, textTransform: "capitalize" }}>{dateStr}</div>
      </div>

      <button style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 8, padding: "7px 8px", cursor: "pointer", color: "#8a8a96", display: "flex", alignItems: "center", transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,18,18,0.1)"; e.currentTarget.style.color = "#A31212"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
        <IconBell />
        <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "#A31212", borderRadius: "50%", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
      </button>

      <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setOpen((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)", border: "2px solid #2a2a2e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2e")}>
          ER
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 180, background: "#212125", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2a2e" }}>
              <div style={{ color: "#f0f0f2", fontSize: 13, fontWeight: 600 }}>Emely</div>
              <div style={{ color: "#5a5a65", fontSize: 11 }}>Secretario/a</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#c0c0c8", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Mi perfil</button>
            <button onClick={() => { setOpen(false); onLogout(); }} style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#e87070", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,18,18,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Generate Invoice Modal ────────────────────────────────────────────────────
interface GenerateModalProps {
  readyOrders: ReadyOrder[];
  preSelectedId?: number;
  onClose: () => void;
  onConfirm: (orderId: number, method: PayMethod) => string;
}

function GenerateModal({ readyOrders, preSelectedId, onClose, onConfirm }: GenerateModalProps) {
  const [orderId, setOrderId] = useState<number | "">(preSelectedId ?? (readyOrders[0]?.id ?? ""));
  const [method, setMethod] = useState<PayMethod | "">("");
  const [success, setSuccess] = useState<string | null>(null);

  const order = readyOrders.find((o) => o.id === orderId);
  const sub  = order?.subtotal ?? 0;
  const iva  = calcIva(sub);
  const tot  = calcTotal(sub);

  function handleConfirm() {
    if (!order || !method) return;
    const num = onConfirm(order.id, method as PayMethod);
    setSuccess(num);
    setTimeout(onClose, 2400);
  }

  const methods: PayMethod[] = ["Efectivo", "Tarjeta", "Transferencia"];
  const methodIcon: Record<PayMethod, string> = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "🏦" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <style>{`
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 500, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {success && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.95)", borderRadius: 18, gap: 16 }}>
            <div className="success-pop" style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700 }}>Factura generada</div>
              <div style={{ color: "#4ade80", fontSize: 14, marginTop: 4 }}>{success}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Generar Factura</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Selecciona la orden y el método de pago</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Orden finalizada</label>
            {readyOrders.length === 0 ? (
              <div style={{ background: "#252529", border: "1px solid #35353a", borderRadius: 8, padding: "12px 14px", color: "#5a5a65", fontSize: 13 }}>No hay órdenes listas para facturar.</div>
            ) : (
              <div style={{ position: "relative" }}>
                <select value={orderId} onChange={(e) => setOrderId(Number(e.target.value))}
                  style={{ background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 36px 10px 14px", width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none", appearance: "none", cursor: "pointer" }}>
                  {readyOrders.map((o) => <option key={o.id} value={o.id}>{o.plate} — {o.client} — {fmtCLP(o.subtotal)}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65" }}>▾</span>
              </div>
            )}
          </div>

          {order && (
            <div style={{ background: "#252529", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 14 }}>{order.plate} · {order.model}</div>
                  <div style={{ color: "#8a8a96", fontSize: 12, marginTop: 2 }}>Cliente: {order.client}</div>
                  <div style={{ color: "#6a6a76", fontSize: 12 }}>Mecánico: {order.mechanic}</div>
                </div>
                <div style={{ color: "#5a5a65", fontSize: 11 }}>{order.completedDate}</div>
              </div>
              <div style={{ borderTop: "1px solid #35353a", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {order.services.map((s, i) => <span key={i} style={{ color: "#8a8a96", fontSize: 12 }}>• {s}</span>)}
              </div>
              <div style={{ borderTop: "1px solid #35353a", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8a8a96", fontSize: 13 }}>Subtotal</span>
                  <span style={{ color: "#c0c0c8", fontSize: 13 }}>{fmtCLP(sub)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#8a8a96", fontSize: 13 }}>IVA (19%)</span>
                  <span style={{ color: "#c0c0c8", fontSize: 13 }}>{fmtCLP(iva)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(163,18,18,0.08)", borderRadius: 6, padding: "8px 10px" }}>
                  <span style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Total</span>
                  <span style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>{fmtCLP(tot)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Método de pago</label>
            <div style={{ display: "flex", gap: 10 }}>
              {methods.map((m) => {
                const active = method === m;
                return (
                  <button key={m} onClick={() => setMethod(m)}
                    style={{ flex: 1, background: active ? "rgba(163,18,18,0.15)" : "#252529", border: `1.5px solid ${active ? "#A31212" : "#35353a"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ fontSize: 20 }}>{methodIcon[m]}</span>
                    <span style={{ color: active ? "#f0f0f2" : "#8a8a96", fontSize: 12, fontWeight: active ? 600 : 400 }}>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!order || !method}
            style={{ background: !order || !method ? "#35353a" : "#A31212", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: !order || !method ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", opacity: !order || !method ? 0.5 : 1 }}
            onMouseEnter={(e) => { if (order && method) { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,0.4)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = !order || !method ? "#35353a" : "#A31212"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
            Confirmar y generar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Detail Modal ──────────────────────────────────────────────────────
function DetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const statusColor: Record<string, string> = { Pagada: "#4ade80", Pendiente: "#facc15", Anulada: "#94a3b8" };
  const methodColor: Record<string, string> = { Efectivo: "#4ade80", Tarjeta: "#60a5fa", Transferencia: "#a78bfa" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto", color: "#111" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: "#0D0D0F", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>TALLER BONILLA</div>
            <div style={{ color: "#A31212", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Taller Automotriz</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 800 }}>{invoice.number}</div>
            <div style={{ color: "#5a5a65", fontSize: 11 }}>{invoice.date}</div>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Facturado a</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{invoice.client}</div>
            </div>
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Vehículo</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{invoice.plate}</div>
              <div style={{ fontSize: 11, color: "#666" }}>{invoice.model}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Servicios realizados</div>
            <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
              {invoice.services.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: i < invoice.services.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 13 }}>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" }}>
              <span>Subtotal</span><span>{fmtCLP(invoice.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" }}>
              <span>IVA (19%)</span><span>{fmtCLP(invoice.iva)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, borderTop: "1.5px solid #e0e0e0", paddingTop: 8 }}>
              <span>TOTAL</span><span style={{ color: "#A31212" }}>{fmtCLP(invoice.total)}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 4 }}>Método de pago</div>
              <span style={{ background: `${methodColor[invoice.paymentMethod]}22`, color: methodColor[invoice.paymentMethod], fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{invoice.paymentMethod}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 4 }}>Estado</div>
              <span style={{ background: `${statusColor[invoice.status]}22`, color: statusColor[invoice.status], fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{invoice.status}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
            <span>Mecánico: <strong style={{ color: "#333" }}>{invoice.mechanic}</strong></span>
            <span style={{ color: "#bbb", fontSize: 10 }}>Sistema Taller Bonilla</span>
          </div>
        </div>
        <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "9px 20px", color: "#555", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cerrar</button>
          <button onClick={() => window.print()} style={{ background: "#0D0D0F", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CajeroDashboard ───────────────────────────────────────────────────────────
interface Props { session: Session; onLogout: () => void; }

export default function CajeroDashboard({ onLogout }: Props) {
  const [section, setSection]         = useState<CajSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices]       = useState<Invoice[]>(SEED_INVOICES);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>(SEED_READY_ORDERS);
  const [clients, setClients]         = useState<Client[]>(SEED_CLIENTS);
  const [vehicles, setVehicles]       = useState<Vehicle[]>(SEED_VEHICLES);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(SEED_SERVICE_ORDERS);
  const [genModal, setGenModal]       = useState<number | "new" | null>(null);
  const [detailId, setDetailId]       = useState<number | null>(null);

  function openGenerate(orderId?: number) {
    setGenModal(orderId ?? "new");
    setSection("facturacion");
  }

  function handleConfirm(orderId: number, method: PayMethod): string {
    const order = readyOrders.find((o) => o.id === orderId)!;
    const num = nextInvoiceNumber();
    const sub = order.subtotal;
    const iva = calcIva(sub);
    const newInvoice: Invoice = {
      id: Date.now(), number: num, orderId,
      plate: order.plate, model: order.model, client: order.client, mechanic: order.mechanic,
      services: order.services, subtotal: sub, iva, total: calcTotal(sub),
      paymentMethod: method, status: "Pendiente", date: TODAY,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
    setGenModal(null);
    return num;
  }

  function markPaid(id: number) {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "Pagada" } : inv));
  }

  function cancelInvoice(id: number) {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "Anulada" } : inv));
  }

  const detailInvoice = invoices.find((inv) => inv.id === detailId) ?? null;
  const shared = { invoices, readyOrders, onGenerateFor: openGenerate, onViewDetail: setDetailId, onMarkPaid: markPaid, onCancel: cancelInvoice };

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", background: "#1C1C1F", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .caj-sidebar-desktop { display: none !important; }
          .caj-hamburger { display: flex !important; }
          .caj-clock { display: none !important; }
        }
      `}</style>

      <Sidebar active={section} onSelect={setSection} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar onLogout={onLogout} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {section === "dashboard"   && <CajeroHome {...shared} serviceOrders={serviceOrders} onNewOrder={() => setSection("ordenes")} />}
          {section === "clientes"    && <CajeroClientes clients={clients} vehicles={vehicles} onAddClient={(c) => setClients((prev) => [...prev, c])} />}
          {section === "vehiculos"   && <CajeroVehiculos vehicles={vehicles} clients={clients} onAddVehicle={(v) => setVehicles((prev) => [...prev, v])} onAddClient={(c) => setClients((prev) => [...prev, c])} />}
          {section === "ordenes"     && <CajeroOrdenes serviceOrders={serviceOrders} vehicles={vehicles} clients={clients} onAddOrder={(o) => setServiceOrders((prev) => [...prev, o])} onAddVehicle={(v) => setVehicles((prev) => [...prev, v])} onAddClient={(c) => setClients((prev) => [...prev, c])} />}
          {section === "facturacion" && <CajeroFacturacion {...shared} onOpenGenerate={() => setGenModal("new")} />}
        </main>
      </div>

      {genModal !== null && (
        <GenerateModal
          readyOrders={readyOrders}
          preSelectedId={typeof genModal === "number" ? genModal : undefined}
          onClose={() => setGenModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      {detailInvoice && <DetailModal invoice={detailInvoice} onClose={() => setDetailId(null)} />}
    </div>
  );
}
