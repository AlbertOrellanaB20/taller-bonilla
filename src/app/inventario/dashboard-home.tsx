"use client";

import { useEffect, useState } from "react";
import { IconBox, IconTruck, IconWarning } from "@/components/dashboard/icons";
import { useInventarioData } from "./context";
import { stockStatus, STATUS_STYLE } from "./lib/data";
import type { UsoRepuesto } from "@/lib/domain/inventario";

function useCountUp(target: number, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    function frame() {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target, dur]);
  return v;
}

function UsageChart({ data }: { data: UsoRepuesto[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.used), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {data.map((d, i) => (
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
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 9, color: hov === i ? "#f0f0f2" : "#5a5a65", transition: "color 0.2s", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHome({ topUsedParts }: { topUsedParts: UsoRepuesto[] }) {
  const { parts, suppliers, openAdjust } = useInventarioData();

  const totalParts = parts.length;
  const lowStock = parts.filter((p) => stockStatus(p) !== "ok").length;
  const totalValue = parts.reduce((a, p) => a + p.stock * p.price, 0);
  const activeSup = suppliers.length;
  const criticals = parts.filter((p) => stockStatus(p) !== "ok").sort((a, b) => a.stock / a.minStock - b.stock / b.minStock);

  const c1 = useCountUp(totalParts);
  const c2 = useCountUp(lowStock);
  const c3 = useCountUp(Math.round(totalValue / 1000));
  const c4 = useCountUp(activeSup);

  const kpis = [
    { label: "Repuestos totales", value: c1, suffix: "", color: "#a78bfa", warn: false, icon: <IconBox /> },
    { label: "Stock bajo / crítico", value: c2, suffix: "", color: "#f87171", warn: true, icon: <IconWarning /> },
    { label: "Valor del inventario", value: c3, suffix: "k", color: "#4ade80", warn: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    { label: "Proveedores activos", value: c4, suffix: "", color: "#60a5fa", warn: false, icon: <IconTruck /> },
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

      <div className="inv-kpis">
        {kpis.map((k, i) => (
          <div key={k.label}
            className={`kpi-${i + 1}`}
            style={{ background: k.warn && k.value > 0 ? "rgba(239,68,68,0.05)" : "#212125", border: `1px solid ${k.warn && k.value > 0 ? "rgba(239,68,68,0.25)" : "#2a2a2e"}`, borderRadius: 14, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(139,92,246,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
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

      <div className="inv-mid">
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
                        <button onClick={() => openAdjust(p.id)}
                          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 6, padding: "4px 10px", color: "#a78bfa", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; e.currentTarget.style.color = "#a78bfa"; }}>
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

        <div className="inv-card">
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 18px" }}>Más utilizados este mes</h2>
          {topUsedParts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#5a5a65", fontSize: 13 }}>Todavía no hay repuestos usados este mes.</div>
          ) : (
            <>
              <UsageChart data={topUsedParts} />
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {topUsedParts.slice(0, 4).map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8a8a96", fontSize: 12 }}>{d.name}</span>
                    <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>{d.used} uds.</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
