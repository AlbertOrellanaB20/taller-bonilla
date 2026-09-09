import { useEffect, useState } from "react";
import { Invoice, ReadyOrder, ServiceOrder, fmtCLP, TODAY } from "./cajeroData";

// ── Shared props ──────────────────────────────────────────────────────────────
export interface CajeroSharedProps {
  invoices: Invoice[];
  readyOrders: ReadyOrder[];
  onGenerateFor: (orderId?: number) => void;
  onViewDetail: (id: number) => void;
  onMarkPaid: (id: number) => void;
  onCancel: (id: number) => void;
}

// ── Count-up ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 1300) {
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

// ── Revenue bar chart ─────────────────────────────────────────────────────────
const WEEK = [
  { label: "Lun", value: 420000 },
  { label: "Mar", value: 610000 },
  { label: "Mié", value: 355000 },
  { label: "Jue", value: 720000 },
  { label: "Vie", value: 855000 },
  { label: "Sáb", value: 295000 },
  { label: "Dom", value: 0 },
];

function WeekChart() {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(...WEEK.map((d) => d.value), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
        {WEEK.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 }}>
            {hov === i && d.value > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "#f0f0f2", background: "#2a2a2e", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" }}>{fmtCLP(d.value)}</span>}
            <div
              style={{ width: "100%", height: d.value === 0 ? 3 : `${(d.value / max) * 100}%`, background: d.value === 0 ? "#252529" : hov === i ? "linear-gradient(180deg,#c01515,#A31212)" : "linear-gradient(180deg,#A31212,#7a0d0d)", borderRadius: "4px 4px 0 0", cursor: d.value > 0 ? "pointer" : "default", transition: "all 0.2s", boxShadow: hov === i && d.value > 0 ? "0 0 12px rgba(163,18,18,0.4)" : "none" }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {WEEK.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 11, color: hov === i ? "#f0f0f2" : "#5a5a65", transition: "color 0.2s" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, formatted, delta, positive, warning, icon, cls }: { label: string; value: number; formatted?: boolean; delta: string; positive: boolean; warning?: boolean; icon: JSX.Element; cls: string }) {
  const count = useCountUp(value);
  const isWarn = warning && value > 0;

  return (
    <div className={cls}
      style={{ background: isWarn ? "rgba(234,179,8,0.05)" : "#212125", border: `1px solid ${isWarn ? "rgba(234,179,8,0.25)" : "#2a2a2e"}`, borderRadius: 14, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 10, cursor: "default", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(163,18,18,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ color: "#8a8a96", fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: isWarn ? "#f59e0b" : "#A31212", opacity: 0.8 }}>{icon}</span>
      </div>
      <div>
        <div style={{ color: isWarn ? "#fbbf24" : "#f0f0f2", fontSize: formatted ? 20 : 26, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {formatted ? fmtCLP(count) : count}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: positive ? "#4ade80" : isWarn ? "#fbbf24" : "#f87171" }}>
            {positive ? "▲" : "▼"} {delta}
          </span>
          <span style={{ color: "#5a5a65", fontSize: 11 }}>vs. ayer</span>
        </div>
      </div>
    </div>
  );
}

// ── Payment badge ─────────────────────────────────────────────────────────────
const PAY_COLOR: Record<string, { bg: string; color: string }> = {
  Efectivo:      { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  Tarjeta:       { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  Transferencia: { bg: "rgba(139,92,246,0.12)",  color: "#a78bfa" },
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Pagada:   { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  Pendiente:{ bg: "rgba(234,179,8,0.12)",   color: "#facc15" },
  Anulada:  { bg: "rgba(148,163,184,0.1)",  color: "#94a3b8" },
};

function Badge({ label, map }: { label: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[label] ?? { bg: "rgba(255,255,255,0.08)", color: "#f0f0f2" };
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>;
}

// ── CajeroHome ────────────────────────────────────────────────────────────────
interface CajeroHomeProps extends CajeroSharedProps {
  serviceOrders: ServiceOrder[];
  onNewOrder: () => void;
}

export default function CajeroHome({ invoices, readyOrders, serviceOrders, onGenerateFor, onViewDetail, onMarkPaid, onCancel, onNewOrder }: CajeroHomeProps) {
  const todayInvoices  = invoices.filter((inv) => inv.date === TODAY);
  const ingresoHoy     = todayInvoices.filter((inv) => inv.status === "Pagada").reduce((a, inv) => a + inv.total, 0);
  const pendientesN    = invoices.filter((inv) => inv.status === "Pendiente").length;
  const emitidasHoy    = todayInvoices.length;
  const totalMes       = invoices.filter((inv) => inv.status === "Pagada").reduce((a, inv) => a + inv.total, 0);
  const vehiculosHoy   = serviceOrders.filter((o) => o.receivedDate === TODAY).length;
  const recent         = invoices.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1300 }}>
      <style>{`
        .caj-kpi { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
        .caj-mid  { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
        .caj-card { background: #212125; border: 1px solid #2a2a2e; border-radius: 14px; padding: 20px; }
        @media (max-width: 1200px) { .caj-kpi { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 1050px) { .caj-mid { grid-template-columns: 1fr; } }
        @media (max-width: 700px)  { .caj-kpi { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 420px)  { .caj-kpi { grid-template-columns: 1fr; } }
        .rdt { width: 100%; border-collapse: collapse; }
        .rdt th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .rdt td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .rdt tr:last-child td { border-bottom: none; }
        .rdt tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .gen-btn { background: rgba(163,18,18,0.12); border: 1px solid rgba(163,18,18,0.3); color: #f87171; border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: "Inter",sans-serif; transition: all .2s; white-space: nowrap; }
        .gen-btn:hover { background: #A31212; color: #fff; box-shadow: 0 0 12px rgba(163,18,18,.35); }
        .act-btn { background: rgba(255,255,255,0.04); border: 1px solid #2a2a2e; border-radius: 6px; padding: 4px 9px; color: #8a8a96; font-size: 11px; cursor: pointer; font-family: "Inter",sans-serif; transition: all .15s; }
        .act-btn:hover { background: rgba(163,18,18,0.1); border-color: rgba(163,18,18,.3); color: #f87171; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Recepción y caja — Taller Bonilla</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onNewOrder}
            style={{ background: "rgba(163,18,18,0.12)", border: "1px solid rgba(163,18,18,0.35)", borderRadius: 9, padding: "9px 16px", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,.35)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(163,18,18,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
            + Nueva Orden
          </button>
          <button onClick={() => onGenerateFor()}
            style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,.4)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
            + Generar factura
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="caj-kpi">
        <KpiCard cls="kpi-1" label="Ingresos de hoy"       value={ingresoHoy}   formatted delta="18%"                              positive icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <KpiCard cls="kpi-2" label="Facturas pendientes"   value={pendientesN}  delta={pendientesN > 0 ? "por cobrar" : "al día"} positive={false} warning={pendientesN > 0} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
        <KpiCard cls="kpi-3" label="Emitidas hoy"          value={emitidasHoy}  delta="5"                                         positive icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
        <KpiCard cls="kpi-4" label="Total del mes"         value={totalMes}     formatted delta="22%"                              positive icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
        <KpiCard cls="kpi-4" label="Vehículos recibidos hoy" value={vehiculosHoy} delta={vehiculosHoy > 0 ? "en proceso" : "sin ingresos"} positive={vehiculosHoy > 0} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><path d="M8 17v2"/><path d="M16 17v2"/><path d="M7 9l2-4h6l2 4"/></svg>} />
      </div>

      {/* Ready to bill + chart */}
      <div className="caj-mid">
        <div className="caj-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>Órdenes listas para facturar</h2>
            <span style={{ background: readyOrders.length > 0 ? "rgba(163,18,18,0.15)" : "rgba(34,197,94,0.1)", color: readyOrders.length > 0 ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
              {readyOrders.length} pendientes
            </span>
          </div>
          {readyOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#5a5a65", fontSize: 13 }}>✓ Todas las órdenes han sido facturadas.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="rdt">
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Cliente</th>
                    <th>Mecánico</th>
                    <th>Total</th>
                    <th>F. Finalización</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {readyOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 12 }}>{o.plate}</div>
                        <div style={{ color: "#6a6a76", fontSize: 11, marginTop: 2 }}>{o.model}</div>
                      </td>
                      <td>{o.client}</td>
                      <td style={{ color: "#8a8a96" }}>{o.mechanic}</td>
                      <td style={{ color: "#f0f0f2", fontWeight: 600 }}>{fmtCLP(o.subtotal)}</td>
                      <td style={{ color: "#6a6a76", fontSize: 12 }}>{o.completedDate}</td>
                      <td><button className="gen-btn" onClick={() => onGenerateFor(o.id)}>Generar factura</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="caj-card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 18px" }}>Ingresos de la semana</h2>
          <WeekChart />
        </div>
      </div>

      {/* Recent invoices */}
      <div className="caj-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>Últimas facturas emitidas</h2>
          <span style={{ color: "#5a5a65", fontSize: 12 }}>Mostrando {recent.length} de {invoices.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="rdt">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 12 }}>{inv.number}</td>
                  <td>{inv.client}</td>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#c0c0c8" }}>{inv.plate}</div>
                    <div style={{ fontSize: 11, color: "#5a5a65" }}>{inv.model}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: "#f0f0f2" }}>{fmtCLP(inv.total)}</td>
                  <td><Badge label={inv.paymentMethod} map={PAY_COLOR} /></td>
                  <td><Badge label={inv.status} map={STATUS_COLOR} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="act-btn" onClick={() => onViewDetail(inv.id)}>Ver</button>
                      {inv.status === "Pendiente" && <button className="act-btn" style={{ color: "#4ade80" }} onClick={() => onMarkPaid(inv.id)}>Pagar</button>}
                      {inv.status !== "Anulada" && <button className="act-btn" style={{ color: "#f87171" }} onClick={() => onCancel(inv.id)}>Anular</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
