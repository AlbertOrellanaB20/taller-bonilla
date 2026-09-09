import { useState } from "react";
import { Client, Vehicle, nextClientId, nextVehicleId } from "./cajeroData";

interface Props {
  vehicles: Vehicle[];
  clients: Client[];
  onAddVehicle: (v: Vehicle) => void;
  onAddClient: (c: Client) => void;
}

const BLANK_VEH = { plate: "", brand: "", model: "", year: new Date().getFullYear(), color: "", mileage: 0, clientId: 0 };
const BLANK_CLI = { name: "", phone: "", address: "", dui: "" };

export default function CajeroVehiculos({ vehicles, clients, onAddVehicle, onAddClient }: Props) {
  const [modal, setModal]           = useState(false);
  const [veh, setVeh]               = useState(BLANK_VEH);
  const [newClient, setNewClient]   = useState(false);
  const [cli, setCli]               = useState(BLANK_CLI);
  const [search, setSearch]         = useState("");
  const [saved, setSaved]           = useState(false);

  const filtered = vehicles.filter((v) => {
    const owner = clients.find((c) => c.id === v.clientId);
    return `${v.plate} ${v.brand} ${v.model} ${owner?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });

  function ownerName(clientId: number) {
    return clients.find((c) => c.id === clientId)?.name ?? "—";
  }

  function openModal() { setVeh({ ...BLANK_VEH, clientId: clients[0]?.id ?? 0 }); setCli(BLANK_CLI); setNewClient(false); setSaved(false); setModal(true); }

  function handleSave() {
    if (!veh.plate.trim() || !veh.brand.trim()) return;
    let clientId = veh.clientId;
    if (newClient) {
      if (!cli.name.trim()) return;
      clientId = nextClientId();
      onAddClient({ id: clientId, ...cli });
    }
    onAddVehicle({ id: nextVehicleId(), ...veh, clientId });
    setSaved(true);
    setTimeout(() => { setSaved(false); setModal(false); }, 1800);
  }

  const inputStyle = { background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 14px", width: "100%", fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const label = (t: string) => <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{t}</label>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1300, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .vh-table { width: 100%; border-collapse: collapse; }
        .vh-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .vh-table td { padding: 13px 16px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .vh-table tr:last-child td { border-bottom: none; }
        .vh-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Vehículos</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{vehicles.length} vehículos registrados</p>
        </div>
        <button onClick={openModal}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          + Nuevo Vehículo
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="db-input" placeholder="Buscar por placa, marca, modelo u dueño..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {/* Table */}
      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="vh-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Kilometraje</th>
                <th>Propietario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>No hay vehículos que coincidan.</td></tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td style={{ color: "#f0f0f2", fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{v.plate}</td>
                  <td style={{ color: "#f0f0f2", fontWeight: 600 }}>{v.brand}</td>
                  <td>{v.model}</td>
                  <td style={{ color: "#8a8a96" }}>{v.year}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorHex(v.color), border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      {v.color}
                    </span>
                  </td>
                  <td style={{ color: "#8a8a96" }}>{v.mileage.toLocaleString()} km</td>
                  <td style={{ color: "#60a5fa", fontWeight: 500 }}>{ownerName(v.clientId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={() => setModal(false)}>
          <div style={{ width: "100%", maxWidth: 520, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

            {saved && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.95)", borderRadius: 18, gap: 14 }}>
                <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#f0f0f2", fontSize: 16, fontWeight: 700 }}>Vehículo registrado</div>
                  <div style={{ color: "#4ade80", fontSize: 13, marginTop: 4 }}>{veh.plate} — {veh.brand} {veh.model}</div>
                </div>
              </div>
            )}

            <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Nuevo Vehículo</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Registrar vehículo en el sistema</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Vehicle fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {label("Placa")}
                  <input style={inputStyle} placeholder="Ej: ABC-1234" value={veh.plate} onChange={(e) => setVeh((v) => ({ ...v, plate: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  {label("Marca")}
                  <input style={inputStyle} placeholder="Ej: Toyota" value={veh.brand} onChange={(e) => setVeh((v) => ({ ...v, brand: e.target.value }))} />
                </div>
                <div>
                  {label("Modelo")}
                  <input style={inputStyle} placeholder="Ej: Corolla" value={veh.model} onChange={(e) => setVeh((v) => ({ ...v, model: e.target.value }))} />
                </div>
                <div>
                  {label("Año")}
                  <input style={inputStyle} type="number" placeholder="Ej: 2020" value={veh.year} onChange={(e) => setVeh((v) => ({ ...v, year: Number(e.target.value) }))} />
                </div>
                <div>
                  {label("Color")}
                  <input style={inputStyle} placeholder="Ej: Blanco" value={veh.color} onChange={(e) => setVeh((v) => ({ ...v, color: e.target.value }))} />
                </div>
                <div>
                  {label("Kilometraje")}
                  <input style={inputStyle} type="number" placeholder="Ej: 35000" value={veh.mileage || ""} onChange={(e) => setVeh((v) => ({ ...v, mileage: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Client selector */}
              <div style={{ background: "#252529", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#8a8a96", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Propietario</span>
                  <button onClick={() => setNewClient((v) => !v)}
                    style={{ background: newClient ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${newClient ? "rgba(34,197,94,0.3)" : "#35353a"}`, borderRadius: 6, padding: "4px 10px", color: newClient ? "#4ade80" : "#8a8a96", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    {newClient ? "✓ Creando nuevo" : "+ Crear nuevo cliente"}
                  </button>
                </div>

                {!newClient ? (
                  <div style={{ position: "relative" }}>
                    <select value={veh.clientId} onChange={(e) => setVeh((v) => ({ ...v, clientId: Number(e.target.value) }))}
                      style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                      <option value={0} disabled>Seleccionar cliente...</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.dui}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65" }}>▾</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input style={inputStyle} placeholder="Nombre completo *" value={cli.name} onChange={(e) => setCli((c) => ({ ...c, name: e.target.value }))} />
                    <input style={inputStyle} placeholder="Teléfono" value={cli.phone} onChange={(e) => setCli((c) => ({ ...c, phone: e.target.value }))} />
                    <input style={inputStyle} placeholder="Dirección" value={cli.address} onChange={(e) => setCli((c) => ({ ...c, address: e.target.value }))} />
                    <input style={inputStyle} placeholder="DUI (Ej: 01234567-8)" value={cli.dui} onChange={(e) => setCli((c) => ({ ...c, dui: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancelar</button>
              <button onClick={handleSave}
                disabled={!veh.plate.trim() || !veh.brand.trim() || (newClient ? !cli.name.trim() : !veh.clientId)}
                style={{ background: "#A31212", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s", opacity: (!veh.plate.trim() || !veh.brand.trim() || (newClient ? !cli.name.trim() : !veh.clientId)) ? 0.45 : 1 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; }}>
                Guardar vehículo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function colorHex(color: string): string {
  const map: Record<string, string> = { Blanco: "#f5f5f5", Negro: "#1a1a1a", Gris: "#888", Rojo: "#dc2626", Azul: "#2563eb", Verde: "#16a34a", Plata: "#cbd5e1", Amarillo: "#eab308", Naranja: "#ea580c", Morado: "#9333ea" };
  return map[color] ?? "#6a6a76";
}
