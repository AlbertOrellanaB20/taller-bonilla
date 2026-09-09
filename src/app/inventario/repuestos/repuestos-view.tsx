"use client";

import { useState } from "react";
import { useInventarioData } from "../context";
import { stockStatus, STATUS_STYLE, fmtPrice } from "../lib/data";
import { IconSearch } from "@/components/dashboard/icons";

export default function RepuestosView() {
  const { parts, suppliers, openAdjust, openNewPart } = useInventarioData();
  const [filterSup, setFilterSup] = useState("Todos");
  const [filterSt, setFilterSt] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = parts.filter((p) => {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    const matchSup = filterSup === "Todos" || String(p.supplierId) === filterSup;
    const matchSt = filterSt === "Todos" || stockStatus(p) === filterSt;
    const matchQ = `${p.code} ${p.name} ${sup?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchSup && matchSt && matchQ;
  });

  const selStyle: React.CSSProperties = { background: "#252529", border: "1px solid #35353a", color: "#c0c0c8", borderRadius: 7, padding: "7px 28px 7px 10px", fontSize: 12, outline: "none", appearance: "none", cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1300 }}>
      <style>{`
        .rp-table { width: 100%; border-collapse: collapse; }
        .rp-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .rp-table td { padding: 12px 14px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .rp-table tr:last-child td { border-bottom: none; }
        .rp-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .adj-btn { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; padding: 5px 11px; color: #a78bfa; font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .adj-btn:hover { background: #7c3aed; color: #fff; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Repuestos</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{parts.length} repuestos en catálogo</p>
        </div>
        <button onClick={openNewPart}
          style={{ background: "#7c3aed", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 16px rgba(139,92,246,.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.boxShadow = "none"; }}>
          + Nuevo Repuesto
        </button>
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e22", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", maxWidth: 260, flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }}><IconSearch /></span>
            <input className="db-input" placeholder="Buscar por código, nombre o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 12 }} />
          </div>
          <div style={{ position: "relative" }}>
            <select style={selStyle} value={filterSup} onChange={(e) => setFilterSup(e.target.value)}>
              <option value="Todos">Todos los proveedores</option>
              {suppliers.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
          </div>
          <div style={{ position: "relative" }}>
            <select style={selStyle} value={filterSt} onChange={(e) => setFilterSt(e.target.value)}>
              <option value="Todos">Todos los estados</option>
              <option value="ok">OK</option>
              <option value="low">Stock bajo</option>
              <option value="critical">Crítico</option>
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 9 }}>▾</span>
          </div>
          {(filterSup !== "Todos" || filterSt !== "Todos" || search) && (
            <button onClick={() => { setFilterSup("Todos"); setFilterSt("Todos"); setSearch(""); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #35353a", borderRadius: 6, padding: "5px 10px", color: "#8a8a96", fontSize: 11, cursor: "pointer" }}>
              Limpiar
            </button>
          )}
          <span style={{ marginLeft: "auto", color: "#5a5a65", fontSize: 12 }}>{filtered.length} resultados</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="rp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Proveedor</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Precio unit.</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>No hay repuestos que coincidan.</td></tr>
              )}
              {filtered.map((p) => {
                const st = stockStatus(p);
                const ss = STATUS_STYLE[st];
                const sup = suppliers.find((s) => s.id === p.supplierId);
                const pct = Math.min(100, Math.round((p.stock / p.minStock) * 100));
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "monospace", color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>{p.code}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: "#8a8a96", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sup?.name ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: ss.color, fontWeight: 700, fontSize: 14, minWidth: 24 }}>{p.stock}</span>
                        <div style={{ width: 48, height: 4, background: "#1e1e22", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: st === "ok" ? "#22c55e" : st === "low" ? "#eab308" : "#ef4444", borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#6a6a76" }}>{p.minStock}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 600 }}>{fmtPrice(p.price)}</td>
                    <td>
                      <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{ss.label}</span>
                    </td>
                    <td><button className="adj-btn" onClick={() => openAdjust(p.id)}>Ajustar stock</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e22", display: "flex", justifyContent: "flex-end", gap: 20 }}>
            <span style={{ color: "#5a5a65", fontSize: 12 }}>Valor total filtrado: <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmtPrice(filtered.reduce((a, p) => a + p.stock * p.price, 0))}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
