"use client";

import { useState } from "react";
import { useSecretariaData } from "../context";
import { validarCliente, formatTelefono, formatDui, NOMBRE_MAX, DIRECCION_MAX } from "@/lib/validation";

const BLANK = { name: "", phone: "", address: "", dui: "" };

export default function ClientesView() {
  const { clients, vehicles, addClient } = useSecretariaData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = clients.filter((c) =>
    `${c.name} ${c.phone} ${c.dui}`.toLowerCase().includes(search.toLowerCase())
  );

  function vehicleCount(clientId: number) {
    return vehicles.filter((v) => v.clientId === clientId).length;
  }

  function updateField(key: keyof typeof BLANK, raw: string) {
    const value = key === "phone" ? formatTelefono(raw) : key === "dui" ? formatDui(raw) : raw;
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function handleSave() {
    const errors = validarCliente(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setError(null);
    try {
      await addClient(form);
      setForm(BLANK);
      setFieldErrors({});
      setSaved(true);
      setTimeout(() => { setSaved(false); setModal(false); }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cliente. Intenta de nuevo.");
    }
  }

  const field = (label: string, key: keyof typeof BLANK, placeholder: string, opts?: { maxLength?: number; required?: boolean }) => (
    <div>
      <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
        {label}{opts?.required && <span style={{ color: "#f87171" }}> *</span>}
      </label>
      <input
        className="db-input"
        placeholder={placeholder}
        value={form[key]}
        maxLength={opts?.maxLength}
        onChange={(e) => updateField(key, e.target.value)}
        style={fieldErrors[key] ? { borderColor: "#ef4444" } : undefined}
      />
      {fieldErrors[key] && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200 }}>
      <style>{`
        .cl-table { width: 100%; border-collapse: collapse; }
        .cl-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .cl-table td { padding: 13px 16px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .cl-table tr:last-child td { border-bottom: none; }
        .cl-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Clientes</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{clients.length} clientes registrados</p>
        </div>
        <button onClick={() => { setModal(true); setSaved(false); setForm(BLANK); setFieldErrors({}); setError(null); }}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c01515"; e.currentTarget.style.boxShadow = "0 0 16px rgba(163,18,18,.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#A31212"; e.currentTarget.style.boxShadow = "none"; }}>
          + Nuevo Cliente
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 360 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input className="db-input" placeholder="Buscar por nombre, teléfono o DUI..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="cl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre completo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>DUI</th>
                <th>Vehículos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>No hay clientes que coincidan.</td></tr>
              )}
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: "#5a5a65", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ color: "#f0f0f2", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{c.phone}</td>
                  <td style={{ color: "#8a8a96", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.dui}</td>
                  <td>
                    <span style={{ background: vehicleCount(c.id) > 0 ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.05)", color: vehicleCount(c.id) > 0 ? "#60a5fa" : "#5a5a65", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                      {vehicleCount(c.id)} vehículo{vehicleCount(c.id) !== 1 ? "s" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={() => setModal(false)}>
          <div style={{ width: "100%", maxWidth: 480, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>

            {saved && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.95)", borderRadius: 18, gap: 14 }}>
                <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#f0f0f2", fontSize: 16, fontWeight: 700 }}>Cliente registrado</div>
                  <div style={{ color: "#4ade80", fontSize: 13, marginTop: 4 }}>{form.name || "Nuevo cliente"}</div>
                </div>
              </div>
            )}

            <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Cliente</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Registrar cliente en el sistema</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {field("Nombre completo", "name", "Ej: Juan Alberto Pérez", { maxLength: NOMBRE_MAX, required: true })}
              {field("Teléfono", "phone", "Ej: 7123-4567", { maxLength: 9, required: true })}
              {field("Dirección", "address", "Ej: Col. Escalón, San Salvador", { maxLength: DIRECCION_MAX })}
              {field("DUI", "dui", "Ej: 01234567-8", { maxLength: 10 })}
              {error && (
                <div style={{ background: "rgba(163,18,18,0.12)", border: "1px solid rgba(163,18,18,0.35)", borderRadius: 8, padding: "8px 12px", color: "#e87070", fontSize: 12 }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleSave} disabled={!form.name.trim()}
                style={{ background: form.name.trim() ? "#A31212" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: form.name.trim() ? "pointer" : "not-allowed", opacity: form.name.trim() ? 1 : 0.5, transition: "all .2s" }}
                onMouseEnter={(e) => { if (form.name.trim()) e.currentTarget.style.background = "#c01515"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = form.name.trim() ? "#A31212" : "#35353a"; }}>
                Guardar cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
