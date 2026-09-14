"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "./order-card";
import { useMecanicoData } from "./context";
import { todayDMY } from "@/lib/format";

function useCountUp(target: number, dur = 1100) {
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

const IcoCar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z" /><path d="M8 17v2" /><path d="M16 17v2" /><path d="M7 9l2-4h6l2 4" /></svg>;

export default function DashboardHome() {
  const { orders, advanceStatus, openDetail } = useMecanicoData();

  const assignedToday = orders.filter((o) => o.receivedDate === todayDMY()).length;
  const inProcess = orders.filter((o) => o.status === "En Proceso").length;
  const completedWeek = orders.filter((o) => o.status === "Finalizado").length;
  const activeOrders = orders.filter((o) => o.status !== "Finalizado");
  const finishedOrders = orders.filter((o) => o.status === "Finalizado");

  const c1 = useCountUp(assignedToday);
  const c2 = useCountUp(inProcess);
  const c3 = useCountUp(completedWeek);

  const kpiIcon = (path: React.ReactElement) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      <style>{`
        .mec-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .mec-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        @media (max-width: 700px) { .mec-kpis { grid-template-columns: repeat(3,1fr); gap: 10px; } }
        @media (max-width: 480px) { .mec-kpis { grid-template-columns: 1fr; } .mec-cards { grid-template-columns: 1fr; } }
      `}</style>

      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>Resumen del día</p>
      </div>

      <div className="mec-kpis">
        {[
          { label: "Asignadas hoy", count: c1, color: "#A31212", icon: kpiIcon(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>) },
          { label: "En proceso", count: c2, color: "#3b82f6", icon: kpiIcon(<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />) },
          { label: "Finalizadas", count: c3, color: "#22c55e", icon: kpiIcon(<polyline points="20 6 9 17 4 12" />) },
        ].map((k) => (
          <div key={k.label}
            style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow 0.2s, transform 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(163,18,18,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ color: "#8a8a96", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
            </div>
            <div style={{ color: "#f0f0f2", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.count}</div>
          </div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div>
          <h2 style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>
            Órdenes activas
            <span style={{ marginLeft: 8, background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{activeOrders.length}</span>
          </h2>
          <div className="mec-cards">
            {activeOrders.map((o) => <OrderCard key={o.id} order={o} onAdvance={advanceStatus} onOpenDetail={openDetail} />)}
          </div>
        </div>
      )}

      {finishedOrders.length > 0 && (
        <div>
          <h2 style={{ color: "#5a5a65", fontSize: 14, fontWeight: 600, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Finalizadas esta semana
          </h2>
          <div className="mec-cards">
            {finishedOrders.map((o) => <OrderCard key={o.id} order={o} onAdvance={advanceStatus} onOpenDetail={openDetail} />)}
          </div>
        </div>
      )}

      {activeOrders.length === 0 && finishedOrders.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#5a5a65" }}>
          <IcoCar />
          <div style={{ marginTop: 12, fontSize: 14 }}>No hay órdenes asignadas por ahora.</div>
        </div>
      )}
    </div>
  );
}
