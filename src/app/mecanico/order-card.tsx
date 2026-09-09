"use client";

import { IconCheck } from "@/components/dashboard/icons";
import { type MechanicOrder, STATUS_STYLE, NEXT_STATUS, BTN_LABEL } from "./lib/data";

export function OrderCard({ order, onAdvance, onOpenDetail }: { order: MechanicOrder; onAdvance: (id: number) => void; onOpenDetail: (id: number) => void }) {
  const st = STATUS_STYLE[order.status];
  const next = NEXT_STATUS[order.status];
  const donePct = order.services.length > 0 ? Math.round((order.servicesDone.filter(Boolean).length / order.services.length) * 100) : 0;

  return (
    <div style={{ background: "#212125", border: `1px solid ${order.status === "En Proceso" ? "rgba(59,130,246,0.3)" : "#2a2a2e"}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: order.status === "En Proceso" ? "0 0 20px rgba(59,130,246,0.07)" : "none", transition: "box-shadow 0.2s" }}>

      <div style={{ height: 3, background: order.status === "En Proceso" ? "linear-gradient(90deg,#3b82f6,#60a5fa)" : order.status === "Finalizado" ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#ca8a04,#facc15)" }} />

      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", fontFamily: "monospace" }}>{order.plate}</div>
            <div style={{ color: "#8a8a96", fontSize: 13, marginTop: 2 }}>{order.brand} {order.model} · {order.year}</div>
          </div>
          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{order.status}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <div>
            <div style={{ color: "#c0c0c8", fontSize: 13, fontWeight: 500 }}>{order.client}</div>
            <div style={{ color: "#5a5a65", fontSize: 11 }}>{order.clientPhone}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {order.services.map((s, i) => (
            <span key={i} style={{ background: order.servicesDone[i] ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: order.servicesDone[i] ? "#4ade80" : "#8a8a96", border: `1px solid ${order.servicesDone[i] ? "rgba(34,197,94,0.2)" : "transparent"}`, fontSize: 11, padding: "3px 9px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
              {order.servicesDone[i] && <span style={{ fontSize: 9 }}>✓</span>}
              {s}
            </span>
          ))}
        </div>

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

      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {next && (
          <button onClick={() => onAdvance(order.id)}
            style={{ width: "100%", background: order.status === "En Proceso" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 12, padding: "14px 20px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "opacity 0.15s, transform 0.1s", letterSpacing: "-0.01em" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
            {BTN_LABEL[order.status]}
          </button>
        )}
        {order.status === "Finalizado" && (
          <div style={{ textAlign: "center", padding: "12px 0 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
            <IconCheck /> Trabajo finalizado
          </div>
        )}
        <button onClick={() => onOpenDetail(order.id)}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 12, padding: "12px 20px", color: "#8a8a96", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#c0c0c8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8a8a96"; }}>
          Ver detalle completo
        </button>
      </div>
    </div>
  );
}
