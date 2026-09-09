"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function useCountUp(target: number, duration = 1400) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    function frame() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target, duration]);
  return current;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: reemplazar por datos reales de Supabase (órdenes, facturas, inventario)
// cuando se conecten los módulos correspondientes.

const revenueData = [
  { label: "Lun", value: 380000 },
  { label: "Mar", value: 520000 },
  { label: "Mié", value: 310000 },
  { label: "Jue", value: 680000 },
  { label: "Vie", value: 750000 },
  { label: "Sáb", value: 420000 },
  { label: "Dom", value: 185000 },
];

const topServices = [
  { name: "Cambio de aceite", count: 47 },
  { name: "Frenos y pastillas", count: 31 },
  { name: "Aire acondicionado", count: 28 },
  { name: "Alineación y balanceo", count: 22 },
  { name: "Diagnóstico electrónico", count: 19 },
];

const recentOrders = [
  { plate: "ABC-1234", model: "Toyota Corolla", client: "Juan Pérez", mechanic: "Carlos M.", status: "En Proceso", date: "06/09/2026" },
  { plate: "DEF-5678", model: "Ford Ranger", client: "María López", mechanic: "Pedro S.", status: "Pendiente", date: "06/09/2026" },
  { plate: "GHI-9012", model: "Hyundai Tucson", client: "Roberto Díaz", mechanic: "Miguel T.", status: "Finalizado", date: "05/09/2026" },
  { plate: "JKL-3456", model: "Chevrolet Spark", client: "Ana García", mechanic: "Carlos M.", status: "Entregado", date: "05/09/2026" },
  { plate: "MNO-7890", model: "Nissan Sentra", client: "Luis Torres", mechanic: "José R.", status: "En Proceso", date: "04/09/2026" },
];

const lowStock = [
  { name: "Filtro de aceite", current: 3, min: 10, unit: "uds" },
  { name: "Pastillas de freno", current: 2, min: 8, unit: "uds" },
  { name: "Refrigerante", current: 1, min: 5, unit: "lts" },
  { name: "Bujías NGK", current: 4, min: 12, unit: "uds" },
];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "rgba(234,179,8,0.15)", color: "#facc15" },
  "En Proceso": { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  Finalizado: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  Entregado: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "rgba(255,255,255,0.08)", color: "#f0f0f2" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta: string;
  positive: boolean;
  icon: ReactNode;
  cls: string;
}

function KpiCard({ label, value, format, delta, positive, icon, cls }: KpiProps) {
  const count = useCountUp(value);
  const display = format ? format(count) : String(count);

  return (
    <div
      className={cls}
      style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, cursor: "default", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(163,18,18,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ color: "#8a8a96", fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "#A31212", opacity: 0.8 }}>{icon}</span>
      </div>
      <div>
        <div style={{ color: "#f0f0f2", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{display}</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: positive ? "#4ade80" : "#f87171" }}>
            {positive ? "▲" : "▼"} {delta}
          </span>
          <span style={{ color: "#5a5a65", fontSize: 11 }}>vs. mes anterior</span>
        </div>
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function RevenueChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...revenueData.map((d) => d.value));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
        {revenueData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 }}>
            {hovered === i && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#f0f0f2", whiteSpace: "nowrap", background: "#2a2a2e", padding: "2px 6px", borderRadius: 4 }}>
                {fmt(d.value)}
              </span>
            )}
            <div
              style={{
                width: "100%",
                height: `${(d.value / max) * 100}%`,
                background: hovered === i ? "linear-gradient(180deg, #c01515 0%, #A31212 100%)" : "linear-gradient(180deg, #A31212 0%, #7a0d0d 80%)",
                borderRadius: "4px 4px 0 0",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: hovered === i ? "0 0 14px rgba(163,18,18,0.45)" : "none",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {revenueData.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 11, color: hovered === i ? "#f0f0f2" : "#5a5a65", transition: "color 0.2s" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top services ──────────────────────────────────────────────────────────────

function TopServices() {
  const max = topServices[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {topServices.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "#c0c0c8", fontSize: 13 }}>{s.name}</span>
            <span style={{ color: "#8a8a96", fontSize: 12, fontWeight: 600 }}>{s.count}</span>
          </div>
          <div style={{ height: 5, background: "#252529", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(s.count / max) * 100}%`, background: "linear-gradient(90deg, #A31212, #c01515)", borderRadius: 3, opacity: 1 - i * 0.12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DashboardHome ─────────────────────────────────────────────────────────────

export default function DashboardHome() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400 }}>
      <style>{`
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .bottom-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
        @media (max-width: 1100px) { .bottom-row { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 420px) { .kpi-grid { grid-template-columns: 1fr; } }
        .orders-table { width: 100%; border-collapse: collapse; }
        .orders-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; }
        .orders-table td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; }
        .orders-table tr:last-child td { border-bottom: none; }
        .orders-table tbody tr { transition: background 0.15s; }
        .orders-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .quick-btn { background: rgba(163,18,18,0.1); border: 1px solid rgba(163,18,18,0.25); color: #f0f0f2; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .quick-btn:hover { background: #A31212; border-color: #A31212; box-shadow: 0 0 16px rgba(163,18,18,0.35); transform: translateY(-1px); }
        .card { background: #212125; border: 1px solid #2a2a2e; border-radius: 14px; padding: 20px; }
      `}</style>

      {/* Quick actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Resumen general del taller</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="quick-btn" href="/admin/ordenes">
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nueva Orden
          </Link>
          <Link className="quick-btn" href="/admin/clientes">
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo Cliente
          </Link>
          <Link className="quick-btn" href="/admin/usuarios">
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo Usuario
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard cls="kpi-1" label="Ingresos del mes" value={2847500} format={fmt} delta="18.4%" positive={true}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <KpiCard cls="kpi-2" label="Órdenes activas" value={23} delta="12%" positive={true}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>}
        />
        <KpiCard cls="kpi-3" label="Vehículos en taller" value={18} delta="5%" positive={true}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-4h8l2 4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>}
        />
        <KpiCard cls="kpi-4" label="Stock bajo" value={7} delta="3 items" positive={false}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Ingresos — últimos 7 días</h2>
          <RevenueChart />
        </div>
        <div className="card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Servicios más solicitados</h2>
          <TopServices />
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        {/* Orders table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>Órdenes recientes</h2>
            <Link href="/admin/ordenes" style={{ background: "none", border: "none", color: "#A31212", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Mecánico</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#f0f0f2", fontSize: 12 }}>{o.plate}</div>
                      <div style={{ color: "#6a6a76", fontSize: 11, marginTop: 2 }}>{o.model}</div>
                    </td>
                    <td>{o.client}</td>
                    <td style={{ color: "#8a8a96" }}>{o.mechanic}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: "#6a6a76", fontSize: 12 }}>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>Alertas de inventario</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {lowStock.map((item, i) => {
              const pct = Math.min((item.current / item.min) * 100, 100);
              const barColor = pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#22c55e";
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ color: "#c0c0c8", fontSize: 13 }}>{item.name}</span>
                    <span style={{ color: "#f87171", fontSize: 12, fontWeight: 600 }}>
                      {item.current}/{item.min} {item.unit}
                    </span>
                  </div>
                  <div style={{ height: 4, background: "#252529", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/admin/inventario"
            style={{ marginTop: 18, display: "block", textAlign: "center", width: "100%", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "9px 14px", color: "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all 0.2s", boxSizing: "border-box" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.14)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.08)")}
          >
            Gestionar inventario →
          </Link>
        </div>
      </div>
    </div>
  );
}
