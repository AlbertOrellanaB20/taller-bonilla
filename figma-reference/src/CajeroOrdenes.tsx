import { useState } from "react";
import { Client, Vehicle, ServiceOrder, SERVICE_CATALOG, TODAY, nextServiceOrderId, nextClientId, nextVehicleId, toInputDate, fromInputDate } from "./cajeroData";

interface Props {
  serviceOrders: ServiceOrder[];
  vehicles: Vehicle[];
  clients: Client[];
  onAddOrder: (o: ServiceOrder) => void;
  onAddVehicle: (v: Vehicle) => void;
  onAddClient: (c: Client) => void;
}

const BLANK_VEH = { plate: "", brand: "", model: "", year: new Date().getFullYear(), color: "", mileage: 0, clientId: 0 };
const BLANK_CLI = { name: "", phone: "", address: "", dui: "" };

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default function CajeroOrdenes({ serviceOrders, vehicles, clients, onAddOrder, onAddVehicle, onAddClient }: Props) {
  const [modal, setModal]             = useState(false);
  const [vehicleId, setVehicleId]     = useState<number>(0);
  const [newVehicle, setNewVehicle]   = useState(false);
  const [veh, setVeh]                 = useState(BLANK_VEH);
  const [newClient, setNewClient]     = useState(false);
  const [cli, setCli]                 = useState(BLANK_CLI);
  const [services, setServices]       = useState<string[]>([]);
  const [delivery, setDelivery]       = useState(tomorrow());
  const [comprobante, setComprobante] = useState<ServiceOrder | null>(null);
  const [search, setSearch]           = useState("");

  const filtered = serviceOrders.filter((o) => {
    const v = vehicles.find((x) => x.id === o.vehicleId);
    const c = clients.find((x) => x.id === v?.clientId);
    return `${v?.plate ?? ""} ${v?.brand ?? ""} ${v?.model ?? ""} ${c?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });

  function vehicleLabel(id: number) {
    const v = vehicles.find((x) => x.id === id);
    if (!v) return "—";
    const c = clients.find((x) => x.id === v.clientId);
    return `${v.plate} — ${v.brand} ${v.model} (${c?.name ?? "desconocido"})`;
  }

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function openModal() {
    setVehicleId(vehicles[0]?.id ?? 0);
    setVeh({ ...BLANK_VEH, clientId: clients[0]?.id ?? 0 });
    setCli(BLANK_CLI);
    setNewVehicle(false);
    setNewClient(false);
    setServices([]);
    setDelivery(tomorrow());
    setModal(true);
  }

  function handleSave() {
    if (services.length === 0) return;
    let finalVehicleId = vehicleId;

    if (newVehicle) {
      if (!veh.plate.trim() || !veh.brand.trim()) return;
      let clientId = veh.clientId;
      if (newClient) {
        if (!cli.name.trim()) return;
        clientId = nextClientId();
        onAddClient({ id: clientId, ...cli });
      }
      finalVehicleId = nextVehicleId();
      onAddVehicle({ id: finalVehicleId, ...veh, clientId });
    }

    if (!finalVehicleId) return;
    const order: ServiceOrder = {
      id: nextServiceOrderId(),
      vehicleId: finalVehicleId,
      services,
      receivedDate: TODAY,
      estimatedDelivery: fromInputDate(delivery),
    };
    onAddOrder(order);
    setModal(false);
    setComprobante(order);
  }

  const inputStyle = { background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 14px", width: "100%", fontFamily: "'Inter',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" };

  const canSave = services.length > 0 && (newVehicle ? (veh.plate.trim() && veh.brand.trim() && (newClient ? cli.name.trim() : !!veh.clientId)) : !!vehicleId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .ord-table { width: 100%; border-collapse: collapse; }
        .ord-table th { color: #5a5a65; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #2a2a2e; white-space: nowrap; }
        .ord-table td { padding: 13px 16px; border-bottom: 1px solid #1e1e22; font-size: 13px; color: #c0c0c8; vertical-align: middle; }
        .ord-table tr:last-child td { border-bottom: none; }
        .ord-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .svc-check { display: flex; align-items: center; gap: 10; padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: background .15s; }
        .svc-check:hover { background: rgba(255,255,255,0.03); }
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .success-pop { animation: success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#f0f0f2", fontSize: 20, fontWeight: 700, margin: 0 }}>Órdenes de Servicio</h1>
          <p style={{ color: "#5a5a65", fontSize: 13, margin: "2px 0 0" }}>{serviceOrders.length} órdenes registradas · solo recepción de vehículos</p>
        </div>
        <button onClick={openModal}
          style={{ background: "#A31212", border: "none", borderRadius: 9, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(163,18,18,.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#A31212"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          + Nueva Orden
        </button>
      </div>

      {/* Info notice */}
      <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style={{ color: "#8ab4f8", fontSize: 12 }}>Esta sección registra la recepción del vehículo. El cambio de estado de trabajo lo gestiona la Supervisora.</span>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5a5a65", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="db-input" placeholder="Buscar por placa, modelo o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {/* Table */}
      <div style={{ background: "#212125", border: "1px solid #2a2a2e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ord-table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Vehículo</th>
                <th>Cliente</th>
                <th>Servicios</th>
                <th>Recibido</th>
                <th>Entrega estimada</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#5a5a65" }}>No hay órdenes que coincidan.</td></tr>
              )}
              {filtered.map((o) => {
                const v = vehicles.find((x) => x.id === o.vehicleId);
                const c = clients.find((x) => x.id === v?.clientId);
                const isToday = o.receivedDate === TODAY;
                return (
                  <tr key={o.id}>
                    <td style={{ color: "#f0f0f2", fontWeight: 700, fontSize: 12 }}>ORD-{String(o.id).padStart(4, "0")}</td>
                    <td>
                      <div style={{ color: "#f0f0f2", fontWeight: 600, fontFamily: "monospace", fontSize: 12 }}>{v?.plate ?? "—"}</div>
                      <div style={{ color: "#5a5a65", fontSize: 11 }}>{v?.brand} {v?.model}</div>
                    </td>
                    <td style={{ color: "#60a5fa" }}>{c?.name ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {o.services.slice(0, 2).map((s, i) => (
                          <span key={i} style={{ background: "rgba(255,255,255,0.06)", color: "#c0c0c8", fontSize: 10, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>{s}</span>
                        ))}
                        {o.services.length > 2 && <span style={{ color: "#5a5a65", fontSize: 11 }}>+{o.services.length - 2} más</span>}
                      </div>
                    </td>
                    <td style={{ color: isToday ? "#4ade80" : "#8a8a96", fontSize: 12, fontWeight: isToday ? 600 : 400 }}>{o.receivedDate}{isToday ? " (hoy)" : ""}</td>
                    <td style={{ color: "#8a8a96", fontSize: 12 }}>{o.estimatedDelivery}</td>
                    <td>
                      <span style={{ background: "rgba(234,179,8,0.1)", color: "#facc15", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>En taller</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New order modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={() => setModal(false)}>
          <div style={{ width: "100%", maxWidth: 580, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "94vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>

            <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Nueva Orden de Servicio</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Recepción de vehículo</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Vehicle selector */}
              <div style={{ background: "#252529", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={labelStyle}>Vehículo</span>
                  <button onClick={() => { setNewVehicle((v) => !v); setNewClient(false); }}
                    style={{ background: newVehicle ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${newVehicle ? "rgba(34,197,94,0.3)" : "#35353a"}`, borderRadius: 6, padding: "4px 10px", color: newVehicle ? "#4ade80" : "#8a8a96", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    {newVehicle ? "✓ Registrando nuevo" : "+ Nuevo vehículo"}
                  </button>
                </div>

                {!newVehicle ? (
                  <div style={{ position: "relative" }}>
                    <select value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))}
                      style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                      <option value={0} disabled>Seleccionar vehículo...</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{vehicleLabel(v.id)}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65" }}>▾</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Placa *</label>
                        <input style={inputStyle} placeholder="ABC-1234" value={veh.plate} onChange={(e) => setVeh((v) => ({ ...v, plate: e.target.value.toUpperCase() }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Marca *</label>
                        <input style={inputStyle} placeholder="Toyota" value={veh.brand} onChange={(e) => setVeh((v) => ({ ...v, brand: e.target.value }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Modelo</label>
                        <input style={inputStyle} placeholder="Corolla" value={veh.model} onChange={(e) => setVeh((v) => ({ ...v, model: e.target.value }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Año</label>
                        <input style={inputStyle} type="number" placeholder="2020" value={veh.year} onChange={(e) => setVeh((v) => ({ ...v, year: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Color</label>
                        <input style={inputStyle} placeholder="Blanco" value={veh.color} onChange={(e) => setVeh((v) => ({ ...v, color: e.target.value }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Kilometraje</label>
                        <input style={inputStyle} type="number" placeholder="35000" value={veh.mileage || ""} onChange={(e) => setVeh((v) => ({ ...v, mileage: Number(e.target.value) }))} />
                      </div>
                    </div>

                    {/* Inline client creation */}
                    <div style={{ background: "#1e1e22", borderRadius: 10, padding: 14, marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ ...labelStyle, marginBottom: 0 }}>Propietario</span>
                        <button onClick={() => setNewClient((v) => !v)}
                          style={{ background: newClient ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${newClient ? "rgba(34,197,94,0.3)" : "#35353a"}`, borderRadius: 6, padding: "3px 8px", color: newClient ? "#4ade80" : "#8a8a96", fontSize: 10, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                          {newClient ? "✓ Nuevo" : "+ Nuevo cliente"}
                        </button>
                      </div>
                      {!newClient ? (
                        <div style={{ position: "relative" }}>
                          <select value={veh.clientId} onChange={(e) => setVeh((v) => ({ ...v, clientId: Number(e.target.value) }))}
                            style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                            <option value={0} disabled>Seleccionar cliente...</option>
                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65" }}>▾</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <input style={inputStyle} placeholder="Nombre completo *" value={cli.name} onChange={(e) => setCli((c) => ({ ...c, name: e.target.value }))} />
                          <input style={inputStyle} placeholder="Teléfono" value={cli.phone} onChange={(e) => setCli((c) => ({ ...c, phone: e.target.value }))} />
                          <input style={inputStyle} placeholder="DUI" value={cli.dui} onChange={(e) => setCli((c) => ({ ...c, dui: e.target.value }))} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Service catalog */}
              <div>
                <label style={labelStyle}>Servicios solicitados <span style={{ color: "#f87171" }}>*</span></label>
                <div style={{ background: "#252529", border: "1.5px solid #35353a", borderRadius: 10, overflow: "hidden" }}>
                  {SERVICE_CATALOG.map((s) => {
                    const checked = services.includes(s);
                    return (
                      <label key={s} className="svc-check" style={{ borderBottom: "1px solid #1e1e22" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleService(s)} style={{ display: "none" }} />
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#A31212" : "#35353a"}`, background: checked ? "#A31212" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                          {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span style={{ color: checked ? "#f0f0f2" : "#8a8a96", fontSize: 13, transition: "color .15s" }}>{s}</span>
                      </label>
                    );
                  })}
                </div>
                {services.length > 0 && (
                  <div style={{ marginTop: 8, color: "#4ade80", fontSize: 12 }}>{services.length} servicio{services.length !== 1 ? "s" : ""} seleccionado{services.length !== 1 ? "s" : ""}</div>
                )}
              </div>

              {/* Delivery date */}
              <div>
                <label style={labelStyle}>Fecha estimada de entrega</label>
                <input type="date" value={delivery} min={toInputDate(TODAY)} onChange={(e) => setDelivery(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancelar</button>
              <button onClick={handleSave} disabled={!canSave}
                style={{ background: canSave ? "#A31212" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", opacity: canSave ? 1 : 0.45, transition: "all .2s" }}
                onMouseEnter={(e) => { if (canSave) (e.currentTarget as HTMLButtonElement).style.background = "#c01515"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = canSave ? "#A31212" : "#35353a"; }}>
                Registrar y generar comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprobante de recepción */}
      {comprobante && (() => {
        const v = vehicles.find((x) => x.id === comprobante.vehicleId);
        const c = clients.find((x) => x.id === v?.clientId);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", padding: 16 }} onClick={() => setComprobante(null)}>
            <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", color: "#111" }} onClick={(e) => e.stopPropagation()}>

              <div style={{ background: "#0D0D0F", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>TALLER BONILLA</div>
                  <div style={{ color: "#A31212", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Comprobante de Recepción</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#f0f0f2", fontSize: 16, fontWeight: 800 }}>ORD-{String(comprobante.id).padStart(4, "0")}</div>
                  <div style={{ color: "#5a5a65", fontSize: 11 }}>{comprobante.receivedDate}</div>
                </div>
              </div>

              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Cliente</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c?.name ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{c?.phone ?? ""}</div>
                  </div>
                  <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Vehículo</div>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "monospace" }}>{v?.plate ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{v?.brand} {v?.model} {v?.year}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Servicios solicitados</div>
                  <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
                    {comprobante.services.map((s, i) => (
                      <div key={i} style={{ padding: "9px 12px", borderBottom: i < comprobante.services.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#A31212", fontSize: 10 }}>●</span> {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", background: "#f8f8f8", borderRadius: 8, padding: "12px 14px" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 2 }}>Recibido</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{comprobante.receivedDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 2 }}>Entrega estimada</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#A31212" }}>{comprobante.estimatedDelivery}</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, fontSize: 11, color: "#bbb", textAlign: "center" }}>
                  Secretario/a: Emely Rodríguez · Sistema Taller Bonilla
                </div>
              </div>

              <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setComprobante(null)} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "9px 20px", color: "#555", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cerrar</button>
                <button onClick={() => window.print()} style={{ background: "#0D0D0F", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
