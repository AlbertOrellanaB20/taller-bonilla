import { useState } from "react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const TOP_SERVICES = [
  { name: "Cambio de aceite",        count: 47 },
  { name: "Frenos y pastillas",      count: 31 },
  { name: "Aire acondicionado",      count: 28 },
  { name: "Alineación y balanceo",   count: 22 },
  { name: "Diagnóstico electrónico", count: 19 },
  { name: "Cambio de batería",       count: 14 },
];

const AVG_TIME = [
  { name: "Cambio de aceite",        hours: 1.5 },
  { name: "Alineación",              hours: 1.0 },
  { name: "Cambio de batería",       hours: 0.8 },
  { name: "Diagnóstico",             hours: 2.0 },
  { name: "Frenos",                  hours: 3.5 },
  { name: "Aire acondicionado",      hours: 4.2 },
  { name: "Revisión de motor",       hours: 8.0 },
];

const MECHANIC_PERF = [
  { name: "Pedro Salazar", completed: 18 },
  { name: "José Ramírez",  completed: 16 },
  { name: "Noé Arias",     completed: 14 },
];

// ── Shared chart components ───────────────────────────────────────────────────

function HBarChart({
  data,
  labelKey,
  valueKey,
  unit = "",
  maxValue,
  color = "#A31212",
  hoverColor = "#c01515",
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  unit?: string;
  maxValue?: number;
  color?: string;
  hoverColor?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const mx = maxValue ?? Math.max(...data.map((d) => Number(d[valueKey])), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const pct = (val / mx) * 100;
        const isH = hovered === i;
        return (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: isH ? "#f0f0f2" : "#c0c0c8", fontSize: 13, transition: "color 0.15s" }}>{String(d[labelKey])}</span>
              <span style={{ color: isH ? color : "#8a8a96", fontSize: 12, fontWeight: 600, transition: "color 0.15s" }}>
                {val}{unit}
              </span>
            </div>
            <div style={{ height: 6, background: "#252529", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: isH ? hoverColor : color, borderRadius: 4, transition: "width 0.6s ease, background 0.2s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VertBarChart({ data }: { data: { name: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
        {data.map((d, i) => {
          const isH = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 }}>
              {isH && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f0f0f2", background: "#2a2a2e", padding: "1px 5px", borderRadius: 4 }}>{d.count}</span>
              )}
              <div
                style={{ width: "100%", height: `${(d.count / max) * 100}%`, background: isH ? "linear-gradient(180deg,#c01515,#A31212)" : "linear-gradient(180deg,#A31212,#7a0d0d)", borderRadius: "4px 4px 0 0", cursor: "pointer", transition: "all 0.2s", boxShadow: isH ? "0 0 12px rgba(163,18,18,0.4)" : "none" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: hovered === i ? "#f0f0f2" : "#5a5a65", transition: "color 0.2s", lineHeight: 1.3 }}>
              {d.name.split(" ").map((w, wi) => <span key={wi} style={{ display: "block" }}>{w}</span>)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Export button ─────────────────────────────────────────────────────────────

function ExportButton({ label, format }: { label: string; format: "pdf" | "xlsx" }) {
  const isPdf = format === "pdf";
  return (
    <button
      onClick={() => alert(`Exportando "${label}" como ${format.toUpperCase()}… (función visual, sin backend)`)}
      style={{ display: "flex", alignItems: "center", gap: 6, background: isPdf ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${isPdf ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: 7, padding: "7px 12px", color: isPdf ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
      {isPdf
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      }
      {format.toUpperCase()}
    </button>
  );
}

// ── Report card wrapper ────────────────────────────────────────────────────────

function ReportCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
          <p style={{ color: "#5a5a65", fontSize: 12, margin: "3px 0 0" }}>{description}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton label={title} format="pdf" />
          <ExportButton label={title} format="xlsx" />
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ── SupervisoraReportes ───────────────────────────────────────────────────────

export default function SupervisoraReportes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000, fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Reportes</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Septiembre 2026 · Taller Bonilla</p>
      </div>

      {/* 1. Top services */}
      <ReportCard
        title="Servicios más solicitados del mes"
        description="Total de órdenes por tipo de servicio en septiembre 2026"
      >
        <VertBarChart data={TOP_SERVICES.map((s) => ({ name: s.name, count: s.count }))} />
      </ReportCard>

      {/* 2. Avg repair time */}
      <ReportCard
        title="Tiempo promedio de reparación"
        description="Horas promedio por tipo de servicio completado"
      >
        <HBarChart
          data={AVG_TIME as unknown as Record<string, unknown>[]}
          labelKey="name"
          valueKey="hours"
          unit=" h"
          color="#b45309"
          hoverColor="#d97706"
        />
      </ReportCard>

      {/* 3. Mechanic performance */}
      <ReportCard
        title="Desempeño por mecánico"
        description="Órdenes completadas en el mes actual"
      >
        <HBarChart
          data={MECHANIC_PERF as unknown as Record<string, unknown>[]}
          labelKey="name"
          valueKey="completed"
          unit=" órdenes"
          color="#059669"
          hoverColor="#10b981"
        />
        <div style={{ marginTop: 16, padding: "10px 14px", background: "#252529", borderRadius: 8 }}>
          <p style={{ color: "#5a5a65", fontSize: 12, margin: 0 }}>
            Total equipo: <span style={{ color: "#f0f0f2", fontWeight: 600 }}>
              {MECHANIC_PERF.reduce((a, m) => a + m.completed, 0)} órdenes completadas
            </span> este mes
          </p>
        </div>
      </ReportCard>
    </div>
  );
}
