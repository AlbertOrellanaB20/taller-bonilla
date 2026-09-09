"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { type MechanicOrder, INITIAL_ORDERS, NEXT_STATUS, STATUS_STYLE, PARTS_CATALOG } from "./lib/data";

interface MecanicoDataValue {
  orders: MechanicOrder[];
  advanceStatus: (id: number) => void;
  openDetail: (id: number) => void;
}

const MecanicoDataContext = createContext<MecanicoDataValue | null>(null);

export function useMecanicoData(): MecanicoDataValue {
  const ctx = useContext(MecanicoDataContext);
  if (!ctx) throw new Error("useMecanicoData debe usarse dentro de MecanicoDataProvider");
  return ctx;
}

export function MecanicoDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MechanicOrder[]>(INITIAL_ORDERS);
  const [detailId, setDetailId] = useState<number | null>(null);

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
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Finalizado" } : o)));
  }

  const detailOrder = orders.find((o) => o.id === detailId) ?? null;

  return (
    <MecanicoDataContext.Provider value={{ orders, advanceStatus, openDetail: setDetailId }}>
      {children}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailId(null)}
          onToggleService={toggleService}
          onAddPart={addPart}
          onFinalize={finalizeOrder}
        />
      )}
    </MecanicoDataContext.Provider>
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

  const inputStyle = { background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 14px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <style>{`
        .part-row { display: flex; align-items: center; padding: 9px 14px; border-bottom: 1px solid #1e1e22; gap: 10px; }
        .part-row:last-child { border-bottom: none; }
      `}</style>

      <div className="modal-slide-up" style={{ width: "100%", maxWidth: 600, background: "#212125", borderRadius: "20px 20px 0 0", border: "1px solid #2a2a2e", borderBottom: "none", boxShadow: "0 -24px 80px rgba(0,0,0,0.6)", maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {showSuccess && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: "20px 20px 0 0", gap: 16 }}>
            <div className="success-pop" style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700 }}>Orden finalizada</div>
              <div style={{ color: "#4ade80", fontSize: 14, marginTop: 4 }}>{order.plate} — {order.model}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#35353a" }} />
        </div>

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

          {order.notes && (
            <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span style={{ color: "#d4b54a", fontSize: 13 }}>{order.notes}</span>
            </div>
          )}

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
                    style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < order.services.length - 1 ? "1px solid #1e1e22" : "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${done ? "#22c55e" : "#35353a"}`, background: done ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
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
                  style={{ background: selectedPart ? "rgba(163,18,18,0.12)" : "transparent", border: `1px solid ${selectedPart ? "rgba(163,18,18,0.35)" : "#2a2a2e"}`, borderRadius: 8, padding: "10px 16px", color: selectedPart ? "#f87171" : "#5a5a65", fontSize: 13, fontWeight: 600, cursor: selectedPart ? "pointer" : "not-allowed", transition: "all .2s" }}
                  onMouseEnter={(e) => { if (selectedPart) { e.currentTarget.style.background = "#A31212"; e.currentTarget.style.color = "#fff"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = selectedPart ? "rgba(163,18,18,0.12)" : "transparent"; e.currentTarget.style.color = selectedPart ? "#f87171" : "#5a5a65"; }}>
                  + Agregar al registro
                </button>
              </div>
            )}
          </div>

          {order.status === "En Proceso" && (
            <button onClick={handleFinalize}
              style={{ width: "100%", background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.15s, transform 0.1s" }}
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
