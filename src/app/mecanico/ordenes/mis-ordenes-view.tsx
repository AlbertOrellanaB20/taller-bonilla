"use client";

import { useState } from "react";
import { OrderCard } from "../order-card";
import { useMecanicoData } from "../context";
import type { OrderStatus } from "@/lib/domain/ordenes";

export default function MisOrdenesView() {
  const { orders, advanceStatus, openDetail } = useMecanicoData();
  const [filter, setFilter] = useState<"Todas" | OrderStatus>("Todas");

  const filtered = filter === "Todas" ? orders : orders.filter((o) => o.status === filter);

  const tabs: { label: string; value: "Todas" | OrderStatus }[] = [
    { label: "Todas", value: "Todas" },
    { label: "Pendiente", value: "Pendiente" },
    { label: "En Proceso", value: "En Proceso" },
    { label: "Finalizado", value: "Finalizado" },
  ];
  const TAB_COLOR: Record<string, string> = { Pendiente: "#facc15", "En Proceso": "#60a5fa", Finalizado: "#4ade80", Todas: "#A31212" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <style>{`.ord-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; } @media (max-width: 480px) { .ord-cards { grid-template-columns: 1fr; } }`}</style>

      <div>
        <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Mis Órdenes</h1>
        <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{orders.length} órdenes asignadas a ti</p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const on = filter === t.value;
          const cnt = t.value === "Todas" ? orders.length : orders.filter((o) => o.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setFilter(t.value)}
              style={{ background: on ? `${TAB_COLOR[t.value]}18` : "rgba(255,255,255,0.04)", border: `1.5px solid ${on ? TAB_COLOR[t.value] + "50" : "#2a2a2e"}`, borderRadius: 8, padding: "7px 14px", color: on ? TAB_COLOR[t.value] : "#6a6a76", fontSize: 13, fontWeight: on ? 600 : 400, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}>
              {t.label}
              <span style={{ background: on ? `${TAB_COLOR[t.value]}30` : "rgba(255,255,255,0.07)", color: on ? TAB_COLOR[t.value] : "#5a5a65", fontSize: 11, fontWeight: 700, padding: "0px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#5a5a65", fontSize: 13 }}>No hay órdenes en este estado.</div>
      ) : (
        <div className="ord-cards">
          {filtered.map((o) => <OrderCard key={o.id} order={o} onAdvance={advanceStatus} onOpenDetail={openDetail} />)}
        </div>
      )}
    </div>
  );
}
