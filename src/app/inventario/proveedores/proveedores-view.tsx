"use client";

import { IconTruck } from "@/components/dashboard/icons";
import { useInventarioData } from "../context";

export default function ProveedoresView() {
  const { suppliers, parts, openNewSupplier, toggleSupplierActive } = useInventarioData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <style>{`
        .pv-table { width: 100%; border-collapse: collapse; }
        .pv-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .pv-table td { padding: 14px 16px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .pv-table tr:last-child td { border-bottom: none; }
        .pv-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Proveedores</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{suppliers.length} proveedores registrados</p>
        </div>
        <button onClick={openNewSupplier}
          style={{ background: "#7c3aed", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 16px rgba(139,92,246,.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.boxShadow = "none"; }}>
          + Nuevo Proveedor
        </button>
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="pv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Repuestos suministrados</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => {
                const count = parts.filter((p) => p.supplierId === s.id).length;
                return (
                  <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
                    <td style={{ color: "#5a5a65", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ color: "#f0f0f2", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconTruck />
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.phone || "—"}</td>
                    <td>
                      <span style={{ background: count > 0 ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.05)", color: count > 0 ? "#a78bfa" : "#5a5a65", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                        {count} {count === 1 ? "repuesto" : "repuestos"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
                        <span style={{ color: s.active ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 500 }}>{s.active ? "Activo" : "Inactivo"}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleSupplierActive(s.id, !s.active)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2e", borderRadius: 6, padding: "5px 11px", color: "#8a8a96", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
