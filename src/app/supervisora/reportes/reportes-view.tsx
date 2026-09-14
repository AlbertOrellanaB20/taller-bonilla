"use client";

import { useState, type ReactNode } from "react";
import type { SupervisoraReportes } from "@/lib/domain/reportes";
import { exportReportePdf, exportReporteExcel } from "@/lib/reports/export";

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
          <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: isH ? "#f0f0f2" : "#c0c0c8", fontSize: 13, transition: "color 0.15s" }}>{String(d[labelKey])}</span>
              <span style={{ color: isH ? color : "#8a8a96", fontSize: 12, fontWeight: 600, transition: "color 0.15s" }}>{val}{unit}</span>
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
              {isH && <span style={{ fontSize: 10, fontWeight: 700, color: "#f0f0f2", background: "#2a2a2e", padding: "1px 5px", borderRadius: 4 }}>{d.count}</span>}
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

function ExportButton({ label, format, subtitle, columns, rows }: {
  label: string;
  format: "pdf" | "xlsx";
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  const isPdf = format === "pdf";
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      if (isPdf) exportReportePdf(label, subtitle, columns, rows);
      else await exportReporteExcel(label, columns, rows);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy || rows.length === 0}
      style={{ display: "flex", alignItems: "center", gap: 6, background: isPdf ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${isPdf ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: 7, padding: "7px 12px", color: isPdf ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 600, cursor: rows.length === 0 ? "not-allowed" : "pointer", opacity: rows.length === 0 ? 0.5 : 1, transition: "all 0.2s", whiteSpace: "nowrap" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = rows.length === 0 ? "0.5" : "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = rows.length === 0 ? "0.5" : "1")}>
      {isPdf
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
      }
      {busy ? "..." : format.toUpperCase()}
    </button>
  );
}

function ReportCard({ title, description, columns, rows, children }: { title: string; description: string; columns: string[]; rows: (string | number)[][]; children: ReactNode }) {
  return (
    <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e22", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
          <p style={{ color: "#5a5a65", fontSize: 12, margin: "3px 0 0" }}>{description}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton label={title} format="pdf" subtitle={description} columns={columns} rows={rows} />
          <ExportButton label={title} format="xlsx" subtitle={description} columns={columns} rows={rows} />
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export default function ReportesView({ data }: { data: SupervisoraReportes }) {
  const mesActual = new Date().toLocaleDateString("es-SV", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Reportes</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{mesActual} · Taller Bonilla</p>
      </div>

      <ReportCard
        title="Servicios más solicitados del mes"
        description={`Total de órdenes por tipo de servicio en ${mesActual}`}
        columns={["Servicio", "Órdenes"]}
        rows={data.serviciosTopMes.map((s) => [s.name, s.count])}
      >
        {data.serviciosTopMes.length === 0 ? (
          <EmptyState text="Todavía no hay servicios registrados este mes." />
        ) : (
          <VertBarChart data={data.serviciosTopMes} />
        )}
      </ReportCard>

      <ReportCard
        title="Tiempo promedio de reparación"
        description="Horas promedio por tipo de servicio completado"
        columns={["Servicio", "Horas promedio"]}
        rows={data.tiempoPromedioPorServicio.map((s) => [s.name, s.hours])}
      >
        {data.tiempoPromedioPorServicio.length === 0 ? (
          <EmptyState text="Todavía no hay órdenes finalizadas para calcular tiempos." />
        ) : (
          <HBarChart data={data.tiempoPromedioPorServicio as unknown as Record<string, unknown>[]} labelKey="name" valueKey="hours" unit=" h" color="#b45309" hoverColor="#d97706" />
        )}
      </ReportCard>

      <ReportCard
        title="Desempeño por mecánico"
        description="Órdenes completadas en el mes actual"
        columns={["Mecánico", "Órdenes completadas"]}
        rows={data.desempenoPorMecanico.map((m) => [m.name, m.completed])}
      >
        {data.desempenoPorMecanico.length === 0 ? (
          <EmptyState text="Todavía no hay órdenes completadas este mes." />
        ) : (
          <>
            <HBarChart data={data.desempenoPorMecanico as unknown as Record<string, unknown>[]} labelKey="name" valueKey="completed" unit=" órdenes" color="#059669" hoverColor="#10b981" />
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#252529", borderRadius: 8 }}>
              <p style={{ color: "#5a5a65", fontSize: 12, margin: 0 }}>
                Total equipo: <span style={{ color: "#f0f0f2", fontWeight: 600 }}>{data.desempenoPorMecanico.reduce((a, m) => a + m.completed, 0)} órdenes completadas</span> este mes
              </p>
            </div>
          </>
        )}
      </ReportCard>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign: "center", padding: "24px 0", color: "#5a5a65", fontSize: 13 }}>{text}</div>;
}
