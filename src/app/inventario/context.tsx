"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { type Part, type Supplier, type StockLog, SEED_PARTS, SEED_SUPPLIERS } from "./lib/data";

interface InventarioDataValue {
  parts: Part[];
  suppliers: Supplier[];
  criticalCount: number;
  openAdjust: (partId: number) => void;
  openNewPart: () => void;
  openNewSupplier: () => void;
}

const InventarioDataContext = createContext<InventarioDataValue | null>(null);

export function useInventarioData(): InventarioDataValue {
  const ctx = useContext(InventarioDataContext);
  if (!ctx) throw new Error("useInventarioData debe usarse dentro de InventarioDataProvider");
  return ctx;
}

let _nextPartId = SEED_PARTS.length + 1;
let _nextSupId = SEED_SUPPLIERS.length + 1;

function stockStatusLocal(p: Part) {
  if (p.stock <= 0) return "critical";
  if (p.stock < p.minStock) return p.stock <= Math.ceil(p.minStock * 0.4) ? "critical" : "low";
  return "ok";
}

export function InventarioDataProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<Part[]>(SEED_PARTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [adjustId, setAdjustId] = useState<number | null>(null);
  const [showNewPart, setShowNewPart] = useState(false);
  const [showNewSup, setShowNewSup] = useState(false);
  const [, setLogs] = useState<StockLog[]>([]);

  const criticalCount = parts.filter((p) => stockStatusLocal(p) === "critical").length;

  function handleAdjust(partId: number, type: "entrada" | "salida", qty: number, reason: string) {
    setParts((prev) => prev.map((p) => {
      if (p.id !== partId) return p;
      const delta = type === "entrada" ? qty : -qty;
      return { ...p, stock: Math.max(0, p.stock + delta) };
    }));
    setLogs((prev) => [{ partId, type, qty, reason, date: "07/09/2026" }, ...prev]);
  }

  function handleAddPart(data: Omit<Part, "id">) {
    setParts((prev) => [...prev, { id: _nextPartId++, ...data }]);
  }

  function handleAddSupplier(name: string, phone: string) {
    setSuppliers((prev) => [...prev, { id: _nextSupId++, name, phone }]);
  }

  const adjustPart = parts.find((p) => p.id === adjustId) ?? null;

  return (
    <InventarioDataContext.Provider
      value={{
        parts,
        suppliers,
        criticalCount,
        openAdjust: setAdjustId,
        openNewPart: () => setShowNewPart(true),
        openNewSupplier: () => setShowNewSup(true),
      }}
    >
      {children}

      {adjustPart && (
        <StockModal part={adjustPart} suppliers={suppliers} onClose={() => setAdjustId(null)} onSave={handleAdjust} />
      )}
      {showNewPart && <NewPartModal suppliers={suppliers} onClose={() => setShowNewPart(false)} onSave={handleAddPart} />}
      {showNewSup && <NewSupplierModal onClose={() => setShowNewSup(false)} onSave={handleAddSupplier} />}
    </InventarioDataContext.Provider>
  );
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────

function StockModal({ part, suppliers, onClose, onSave }: {
  part: Part;
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (partId: number, type: "entrada" | "salida", qty: number, reason: string) => void;
}) {
  const [type, setType] = useState<"entrada" | "salida">("entrada");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const sup = suppliers.find((s) => s.id === part.supplierId);

  function handleSave() {
    if (qty < 1 || !reason.trim()) return;
    onSave(part.id, type, qty, reason.trim());
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: type === "entrada" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `2px solid ${type === "entrada" ? "#22c55e" : "#ef4444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={type === "entrada" ? "#22c55e" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Movimiento registrado</div>
              <div style={{ color: type === "entrada" ? "#4ade80" : "#f87171", fontSize: 13, marginTop: 4 }}>{type === "entrada" ? "+" : "-"}{qty} unidades · {part.name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Ajustar stock</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>{part.code} · {part.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Stock actual</div>
              <div style={{ color: "#f0f0f2", fontSize: 22, fontWeight: 800 }}>{part.stock}</div>
            </div>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Mínimo</div>
              <div style={{ color: "#facc15", fontSize: 22, fontWeight: 800 }}>{part.minStock}</div>
            </div>
            <div style={{ flex: 1, background: "#252529", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#5a5a65", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Proveedor</div>
              <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>{sup?.name ?? "—"}</div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tipo de movimiento</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["entrada", "salida"] as const).map((t) => {
                const on = type === t;
                const col = t === "entrada" ? "#22c55e" : "#f87171";
                return (
                  <button key={t} onClick={() => setType(t)}
                    style={{ flex: 1, background: on ? (t === "entrada" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "#252529", border: `1.5px solid ${on ? col + "50" : "#35353a"}`, borderRadius: 10, padding: "12px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                    <span style={{ fontSize: 18 }}>{t === "entrada" ? "📦" : "📤"}</span>
                    <span style={{ color: on ? col : "#8a8a96", fontSize: 13, fontWeight: on ? 700 : 400, textTransform: "capitalize" }}>{t}</span>
                    <span style={{ color: "#5a5a65", fontSize: 10 }}>{t === "entrada" ? "Compra / recepción" : "Uso / merma"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cantidad</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="db-input" style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }} />
          </div>

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Motivo</label>
            <input type="text" placeholder={type === "entrada" ? "Ej: Compra a proveedor, reposición..." : "Ej: Uso en orden ORD-0003, pieza dañada..."}
              value={reason} onChange={(e) => setReason(e.target.value)} className="db-input" />
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSave} disabled={qty < 1 || !reason.trim()}
            style={{ background: qty >= 1 && reason.trim() ? (type === "entrada" ? "#166534" : "#991b1b") : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: qty >= 1 && reason.trim() ? "pointer" : "not-allowed", opacity: qty >= 1 && reason.trim() ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (qty >= 1 && reason.trim()) e.currentTarget.style.filter = "brightness(1.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}>
            Registrar movimiento
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Part Modal ────────────────────────────────────────────────────────────

const BLANK_PART = { code: "", name: "", supplierId: 0, stock: 0, minStock: 0, price: 0 };

function NewPartModal({ suppliers, onClose, onSave }: {
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (p: Omit<Part, "id">) => void;
}) {
  const [form, setForm] = useState({ ...BLANK_PART, supplierId: suppliers[0]?.id ?? 0 });
  const [done, setDone] = useState(false);
  const valid = form.code.trim() && form.name.trim() && form.supplierId > 0;

  function handleSave() {
    if (!valid) return;
    onSave({ ...form });
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  const label = (t: string) => <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{t}</label>;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 520, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid #a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Repuesto registrado</div>
              <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 4 }}>{form.code} · {form.name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Nuevo Repuesto</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Agregar al catálogo de inventario</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              {label("Código")}
              <input className="db-input" placeholder="FIL-021" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              {label("Nombre del repuesto")}
              <input className="db-input" placeholder="Ej: Filtro de aceite premium" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>

          <div>
            {label("Proveedor")}
            <div style={{ position: "relative" }}>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: Number(e.target.value) }))} className="db-select">
                <option value={0} disabled>Seleccionar proveedor...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65", fontSize: 11 }}>▾</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              {label("Stock inicial")}
              <input type="number" min={0} className="db-input" placeholder="0" value={form.stock || ""} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
            <div>
              {label("Stock mínimo")}
              <input type="number" min={1} className="db-input" placeholder="5" value={form.minStock || ""} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
            <div>
              {label("Precio unit. ($)")}
              <input type="number" min={0} className="db-input" placeholder="0" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSave} disabled={!valid}
            style={{ background: valid ? "#7c3aed" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", opacity: valid ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (valid) e.currentTarget.style.background = "#6d28d9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = valid ? "#7c3aed" : "#35353a"; }}>
            Guardar repuesto
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Supplier Modal ────────────────────────────────────────────────────────

function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, phone: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const valid = name.trim();

  function handleSave() {
    if (!valid) return;
    onSave(name.trim(), phone.trim());
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 420, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {done && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.96)", borderRadius: 18, gap: 14 }}>
            <div className="success-pop" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "2px solid #a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Proveedor registrado</div>
              <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 4 }}>{name}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #7c3aed, #5b21b6)", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Nuevo Proveedor</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Registrar en el sistema</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre del proveedor *</label>
            <input className="db-input" placeholder="Ej: Repuestos El Centro S.A." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Teléfono</label>
            <input className="db-input" placeholder="Ej: 2234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 18px", color: "#8a8a96", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSave} disabled={!valid}
            style={{ background: valid ? "#7c3aed" : "#35353a", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", opacity: valid ? 1 : 0.45, transition: "all .2s" }}
            onMouseEnter={(e) => { if (valid) e.currentTarget.style.background = "#6d28d9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = valid ? "#7c3aed" : "#35353a"; }}>
            Guardar proveedor
          </button>
        </div>
      </div>
    </div>
  );
}
