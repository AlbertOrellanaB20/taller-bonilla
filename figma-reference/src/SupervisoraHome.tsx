import { useState, useEffect, useRef } from "react";

type SvSection = "dashboard" | "ordenes" | "empleados" | "reportes";

// ── Data ──────────────────────────────────────────────────────────────────────

export const MECHANICS = ["Noé Arias", "Pedro Salazar", "José Ramírez"];
const UNASSIGNED = "Sin asignar";
const STATUSES = ["Pendiente", "En Proceso", "Finalizado", "Entregado"];

export interface Order {
  id: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  status: string;
  entryDate: string;
  dueDate: string;
  overdue: boolean;
}

const SEED_ORDERS: Order[] = [
  { id: 1, plate: "ABC-1234", model: "Toyota Corolla",  client: "Juan Pérez",    mechanic: "Noé Arias",     status: "En Proceso", entryDate: "04/09/2026", dueDate: "07/09/2026", overdue: false },
  { id: 2, plate: "DEF-5678", model: "Ford Ranger",     client: "María López",   mechanic: UNASSIGNED,      status: "Pendiente",  entryDate: "06/09/2026", dueDate: "09/09/2026", overdue: false },
  { id: 3, plate: "GHI-9012", model: "Hyundai Tucson",  client: "Roberto Díaz",  mechanic: "Pedro Salazar", status: "Finalizado", entryDate: "05/09/2026", dueDate: "07/09/2026", overdue: false },
  { id: 4, plate: "JKL-3456", model: "Chevrolet Spark", client: "Ana García",    mechanic: "Noé Arias",     status: "Entregado",  entryDate: "03/09/2026", dueDate: "06/09/2026", overdue: false },
  { id: 5, plate: "MNO-7890", model: "Nissan Sentra",   client: "Luis Torres",   mechanic: "José Ramírez",  status: "En Proceso", entryDate: "04/09/2026", dueDate: "06/09/2026", overdue: true  },
  { id: 6, plate: "PQR-1111", model: "Honda Civic",     client: "Carmen Ruiz",   mechanic: UNASSIGNED,      status: "Pendiente",  entryDate: "07/09/2026", dueDate: "10/09/2026", overdue: false },
  { id: 7, plate: "STU-2222", model: "Mazda 3",         client: "Diego Méndez",  mechanic: "Pedro Salazar", status: "En Proceso", entryDate: "05/09/2026", dueDate: "08/09/2026", overdue: false },
  { id: 8, plate: "VWX-3333", model: "Kia Sportage",    client: "Paula Moreno",  mechanic: "José Ramírez",  status: "En Proceso", entryDate: "06/09/2026", dueDate: "09/09/2026", overdue: false },
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    setV(0);
    const t0 = Date.now();
    function frame() {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target]);
  return v;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "Pendiente":  { bg: "rgba(234,179,8,0.15)",   color: "#facc15" },
  "En Proceso": { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  "Finalizado": { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  "Entregado":  { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, positive, warning, icon, cls }: { label: string; value: number; delta: string; positive: boolean; warning?: boolean; icon: JSX.Element; cls: string }) {
  const count = useCountUp(value);
  return (
    <div className={cls}
      style={{ background: warning && value > 0 ? "rgba(239,68,68,0.06)" : "#212125", border: `1px solid ${warning && value > 0 ? "rgba(239,68,68,0.25)" : "#2a2a2e"}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(163,18,18,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ color: "#8a8a96", fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: warning && value > 0 ? "#ef4444" : "#A31212", opacity: 0.8 }}>{icon}</span>
      </div>
      <div>
        <div style={{ color: warning && value > 0 ? "#f87171" : "#f0f0f2", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{count}</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: positive ? "#4ade80" : warning ? "#f87171" : "#f87171" }}>
            {positive ? "▲" : "▼"} {delta}
          </span>
          <span style={{ color: "#5a5a65", fontSize: 11 }}>vs. ayer</span>
        </div>
      </div>
    </div>
  );
}

// ── Inline status select ──────────────────────────────────────────────────────

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const s = STATUS_STYLE[value] ?? { bg: "rgba(255,255,255,0.08)", color: "#f0f0f2" };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 20, padding: "3px 24px 3px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer", appearance: "none", fontFamily: "'Inter', sans-serif", outline: "none" }}
      >
        {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
      </select>
      <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: s.color, fontSize: 9 }}>▾</span>
    </div>
  );
}

// ── Mechanic select ───────────────────────────────────────────────────────────

function MechanicSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const unassigned = value === UNASSIGNED || value === "";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={value || UNASSIGNED}
        onChange={(e) => onChange(e.target.value === UNASSIGNED ? UNASSIGNED : e.target.value)}
        style={{ background: "transparent", color: unassigned ? "#f59e0b" : "#c0c0c8", border: "none", borderBottom: `1px dashed ${unassigned ? "#f59e0b40" : "#35353a"}`, padding: "2px 20px 2px 0", fontSize: 13, cursor: "pointer", appearance: "none", fontFamily: "'Inter', sans-serif", outline: "none", minWidth: 110 }}
      >
        <option value={UNASSIGNED}>Sin asignar</option>
        {MECHANICS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <span style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
    </div>
  );
}

// ── Workload chart ────────────────────────────────────────────────────────────

function WorkloadChart({ orders }: { orders: Order[] }) {
  const active = orders.filter((o) => o.status === "En Proceso" || o.status === "Pendiente");
  const counts = MECHANICS.map((m) => ({ name: m, count: active.filter((o) => o.mechanic === m).length }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {counts.map((m) => (
        <div key={m.name}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#c0c0c8", fontSize: 13, fontWeight: 500 }}>{m.name}</span>
            <span style={{ color: m.count > 3 ? "#f87171" : "#8a8a96", fontSize: 12, fontWeight: 600 }}>
              {m.count} {m.count === 1 ? "orden" : "órdenes"}
            </span>
          </div>
          <div style={{ height: 8, background: "#252529", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(m.count / max) * 100}%`, background: m.count > 3 ? "linear-gradient(90deg, #ef4444, #A31212)" : "linear-gradient(90deg, #A31212, #c01515)", borderRadius: 4, transition: "width 0.8s ease" }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 4, padding: "10px 12px", background: "#252529", borderRadius: 8 }}>
        <p style={{ color: "#5a5a65", fontSize: 11, margin: 0 }}>
          {active.filter((o) => o.mechanic === UNASSIGNED).length > 0
            ? `⚠ ${active.filter((o) => o.mechanic === UNASSIGNED).length} orden(es) sin asignar`
            : "✓ Todas las órdenes activas tienen mecánico asignado"}
        </p>
      </div>
    </div>
  );
}

// ── Orders table ──────────────────────────────────────────────────────────────

function OrdersTable({ orders, onUpdateMechanic, onUpdateStatus }: {
  orders: Order[];
  onUpdateMechanic: (id: number, m: string) => void;
  onUpdateStatus: (id: number, s: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMechanic, setFilterMechanic] = useState("Todos");

  const filtered = orders.filter((o) =>
    (filterStatus === "Todos" || o.status === filterStatus) &&
    (filterMechanic === "Todos" || o.mechanic === filterMechanic || (filterMechanic === UNASSIGNED && (o.mechanic === UNASSIGNED || o.mechanic === "")))
  );

  const selectStyle: React.CSSProperties = { background: "#252529", border: "1px solid #35353a", color: "#c0c0c8", borderRadius: 7, padding: "7px 28px 7px 10px", fontSize: 12, fontFamily: "'Inter', sans-serif", outline: "none", appearance: "none", cursor: "pointer" };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "#5a5a65", fontSize: 12 }}>Filtrar:</span>
        <div style={{ position: "relative" }}>
          <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
        </div>
        <div style={{ position: "relative" }}>
          <select style={selectStyle} value={filterMechanic} onChange={(e) => setFilterMechanic(e.target.value)}>
            <option value="Todos">Todos los mecánicos</option>
            <option value={UNASSIGNED}>Sin asignar</option>
            {MECHANICS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
        </div>
        <span style={{ color: "#5a5a65", fontSize: 12, marginLeft: "auto" }}>
          {filtered.length} {filtered.length === 1 ? "orden" : "órdenes"}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Vehículo", "Cliente", "Mecánico asignado", "Estado", "F. Ingreso", "F. Entrega"].map((h) => (
                <th key={h} style={{ color: "#5a5a65", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid #2a2a2e", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ background: o.overdue ? "rgba(239,68,68,0.04)" : "transparent" }}>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {o.overdue && <span title="Retrasada" style={{ color: "#ef4444", fontSize: 14, lineHeight: 1 }}>⚠</span>}
                    <div>
                      <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 12 }}>{o.plate}</div>
                      <div style={{ color: "#6a6a76", fontSize: 11, marginTop: 2 }}>{o.model}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22", color: "#c0c0c8", fontSize: 13 }}>{o.client}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22" }}>
                  <MechanicSelect value={o.mechanic} onChange={(m) => onUpdateMechanic(o.id, m)} />
                </td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22" }}>
                  <StatusSelect value={o.status} onChange={(s) => onUpdateStatus(o.id, s)} />
                </td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22", color: "#6a6a76", fontSize: 12, whiteSpace: "nowrap" }}>{o.entryDate}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e22", color: o.overdue ? "#f87171" : "#6a6a76", fontSize: 12, fontWeight: o.overdue ? 600 : 400, whiteSpace: "nowrap" }}>{o.dueDate}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#5a5a65", fontSize: 13 }}>
                  No hay órdenes que coincidan con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SupervisoraHome ───────────────────────────────────────────────────────────

interface Props {
  onNavigate: (s: SvSection) => void;
  focusTable?: boolean;
}

export default function SupervisoraHome({ onNavigate, focusTable }: Props) {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTable && tableRef.current) {
      setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [focusTable]);

  const activeCount    = orders.filter((o) => o.status === "En Proceso").length;
  const pendingAssign  = orders.filter((o) => o.mechanic === UNASSIGNED && o.status !== "Entregado").length;
  const mechanicsWork  = new Set(orders.filter((o) => o.status === "En Proceso" && o.mechanic !== UNASSIGNED).map((o) => o.mechanic)).size;
  const overdueCount   = orders.filter((o) => o.overdue && o.status !== "Entregado").length;

  function updateMechanic(id: number, mechanic: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, mechanic } : o));
  }
  function updateStatus(id: number, status: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400 }}>
      <style>{`
        .sv-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .sv-bottom { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        .sv-card { background: #212125; border: 1px solid #2a2a2e; border-radius: 14px; padding: 20px; }
        @media (max-width: 1000px) { .sv-bottom { grid-template-columns: 1fr; } }
        @media (max-width: 700px)  { .sv-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 420px)  { .sv-kpi-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Vista de supervisión — Taller Bonilla</p>
        </div>
        <button
          onClick={() => onNavigate("ordenes")}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          Ver todas las órdenes →
        </button>
      </div>

      {/* KPI cards */}
      <div className="sv-kpi-grid">
        <KpiCard cls="kpi-1" label="Órdenes activas hoy" value={activeCount} delta="2" positive={true}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>}
        />
        <KpiCard cls="kpi-2" label="Pendientes de asignar" value={pendingAssign} delta={pendingAssign > 0 ? "requieren atención" : "al día"} positive={false}
          warning={pendingAssign > 0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <KpiCard cls="kpi-3" label="Mecánicos trabajando" value={mechanicsWork} delta="todos activos" positive={true}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KpiCard cls="kpi-4" label="Órdenes retrasadas" value={overdueCount} delta="fuera de plazo" positive={false}
          warning={overdueCount > 0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* Orders table + workload */}
      <div className="sv-bottom">
        <div ref={tableRef} className="sv-card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>Órdenes de Servicio</h2>
          <OrdersTable orders={orders} onUpdateMechanic={updateMechanic} onUpdateStatus={updateStatus} />
        </div>

        <div className="sv-card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 18px" }}>Carga por mecánico</h2>
          <WorkloadChart orders={orders} />
        </div>
      </div>
    </div>
  );
}
