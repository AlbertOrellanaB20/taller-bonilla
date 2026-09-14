"use client";

import { useState } from "react";
import { fmtUSD as fmtCLP } from "@/lib/format";
import { useSecretariaData } from "../context";

const PAY_COLOR: Record<string, { bg: string; color: string }> = {
  Efectivo: { bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
  Tarjeta: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  Transferencia: { bg: "rgba(139,92,246,0.12)", color: "#a78bfa" },
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Pagada: { bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
  Pendiente: { bg: "rgba(234,179,8,0.12)", color: "#facc15" },
  Anulada: { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" },
};

function Badge({ label, map }: { label: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[label] ?? { bg: "rgba(255,255,255,0.08)", color: "#f0f0f2" };
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function FacturacionView() {
  const { invoices, openGenerate, viewDetail, markPaid, cancelInvoice } = useSecretariaData();
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterDate, setFilterDate] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchStatus = filterStatus === "Todos" || inv.status === filterStatus;
    const matchDate = !filterDate || inv.date.includes(filterDate);
    return matchStatus && matchDate;
  });

  const totalFiltered = filtered.reduce((a, inv) => a + (inv.status === "Pagada" ? inv.total : 0), 0);

  const selStyle: React.CSSProperties = { background: "#252529", border: "1px solid #35353a", color: "#c0c0c8", borderRadius: 7, padding: "7px 28px 7px 10px", fontSize: 12, outline: "none", appearance: "none", cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1300 }}>
      <style>{`
        .fac-table { width: 100%; border-collapse: collapse; }
        .fac-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .fac-table td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .fac-table tr:last-child td { border-bottom: none; }
        .fac-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .fac-act { background: rgba(255,255,255,0.04); border: 1px solid #2a2a2e; border-radius: 6px; padding: 4px 10px; color: #8a8a96; font-size: 11px; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .fac-act:hover { background: rgba(163,18,18,0.1); border-color: rgba(163,18,18,.3); color: #f87171; }
        .fac-act.pay:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,.3); color: #4ade80; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Facturación</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{invoices.length} facturas registradas en el sistema</p>
        </div>
        <button onClick={() => openGenerate()}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c01515"; e.currentTarget.style.boxShadow = "0 0 16px rgba(163,18,18,.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#A31212"; e.currentTarget.style.boxShadow = "none"; }}>
          + Generar factura
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Pagadas", count: invoices.filter((i) => i.status === "Pagada").length, color: "#4ade80", bg: "rgba(34,197,94,0.08)" },
          { label: "Pendientes", count: invoices.filter((i) => i.status === "Pendiente").length, color: "#facc15", bg: "rgba(234,179,8,0.08)" },
          { label: "Anuladas", count: invoices.filter((i) => i.status === "Anulada").length, color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#8a8a96", fontSize: 13 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 20, fontWeight: 800 }}>{s.count}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e22", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#5a5a65", fontSize: 12 }}>Filtrar:</span>

          <div style={{ position: "relative" }}>
            <select style={selStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              <option value="Pagada">Pagada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulada">Anulada</option>
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Fecha (ej: 07/09)"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ ...selStyle, padding: "7px 12px", paddingRight: 12, minWidth: 150 }}
            />
          </div>

          {(filterStatus !== "Todos" || filterDate) && (
            <button onClick={() => { setFilterStatus("Todos"); setFilterDate(""); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #35353a", borderRadius: 6, padding: "5px 10px", color: "#8a8a96", fontSize: 11, cursor: "pointer" }}>
              Limpiar
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "#5a5a65", fontSize: 12 }}>{filtered.length} resultados</span>
            {totalFiltered > 0 && (
              <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
                Cobrado: {fmtCLP(totalFiltered)}
              </span>
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="fac-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Vehículo</th>
                <th>Cliente</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>
                    No hay facturas que coincidan con los filtros.
                  </td>
                </tr>
              )}
              {filtered.map((inv) => (
                <tr key={inv.id} style={{ opacity: inv.status === "Anulada" ? 0.5 : 1 }}>
                  <td style={{ color: "#f0f0f2", fontWeight: 700, fontSize: 12 }}>{inv.number}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#f0f0f2", fontSize: 12 }}>{inv.plate}</div>
                    <div style={{ color: "#5a5a65", fontSize: 11, marginTop: 1 }}>{inv.model}</div>
                  </td>
                  <td>{inv.client}</td>
                  <td style={{ color: "#8a8a96", fontSize: 12 }}>{fmtCLP(inv.subtotal)}</td>
                  <td style={{ color: "#6a6a76", fontSize: 12 }}>{fmtCLP(inv.iva)}</td>
                  <td style={{ fontWeight: 700, color: "#f0f0f2" }}>{fmtCLP(inv.total)}</td>
                  <td><Badge label={inv.paymentMethod} map={PAY_COLOR} /></td>
                  <td><Badge label={inv.status} map={STATUS_COLOR} /></td>
                  <td style={{ color: "#6a6a76", fontSize: 12, whiteSpace: "nowrap" }}>{inv.date}</td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="fac-act" onClick={() => viewDetail(inv.id)}>Ver detalle</button>
                      {inv.status === "Pendiente" && (
                        <button className="fac-act pay" onClick={() => markPaid(inv.id)}>Marcar pagada</button>
                      )}
                      {inv.status !== "Anulada" && (
                        <button className="fac-act" onClick={() => cancelInvoice(inv.id)}>Anular</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1e1e22", display: "flex", justifyContent: "flex-end", gap: 24 }}>
            <span style={{ color: "#5a5a65", fontSize: 12 }}>
              Total cobrado (Pagadas): <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmtCLP(filtered.filter((i) => i.status === "Pagada").reduce((a, i) => a + i.total, 0))}</span>
            </span>
            <span style={{ color: "#5a5a65", fontSize: 12 }}>
              Pendiente por cobrar: <span style={{ color: "#facc15", fontWeight: 700 }}>{fmtCLP(filtered.filter((i) => i.status === "Pendiente").reduce((a, i) => a + i.total, 0))}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
