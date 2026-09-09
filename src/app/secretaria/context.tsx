"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  type Client,
  type Vehicle,
  type ServiceOrder,
  type Invoice,
  type ReadyOrder,
  type PayMethod,
  SEED_CLIENTS,
  SEED_VEHICLES,
  SEED_SERVICE_ORDERS,
  SEED_INVOICES,
  SEED_READY_ORDERS,
  nextInvoiceNumber,
  calcIva,
  calcTotal,
  fmtCLP,
  TODAY,
} from "./lib/data";

interface SecretariaDataValue {
  clients: Client[];
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  invoices: Invoice[];
  readyOrders: ReadyOrder[];
  addClient: (c: Client) => void;
  addVehicle: (v: Vehicle) => void;
  addServiceOrder: (o: ServiceOrder) => void;
  openGenerate: (orderId?: number) => void;
  viewDetail: (id: number) => void;
  markPaid: (id: number) => void;
  cancelInvoice: (id: number) => void;
}

const SecretariaDataContext = createContext<SecretariaDataValue | null>(null);

export function useSecretariaData(): SecretariaDataValue {
  const ctx = useContext(SecretariaDataContext);
  if (!ctx) throw new Error("useSecretariaData debe usarse dentro de SecretariaDataProvider");
  return ctx;
}

export function SecretariaDataProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>(SEED_READY_ORDERS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(SEED_VEHICLES);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(SEED_SERVICE_ORDERS);
  const [genModal, setGenModal] = useState<number | "new" | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  function handleConfirm(orderId: number, method: PayMethod): string {
    const order = readyOrders.find((o) => o.id === orderId)!;
    const num = nextInvoiceNumber();
    const sub = order.subtotal;
    const iva = calcIva(sub);
    const newInvoice: Invoice = {
      id: Date.now(),
      number: num,
      orderId,
      plate: order.plate,
      model: order.model,
      client: order.client,
      mechanic: order.mechanic,
      services: order.services,
      subtotal: sub,
      iva,
      total: calcTotal(sub),
      paymentMethod: method,
      status: "Pendiente",
      date: TODAY,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
    setGenModal(null);
    return num;
  }

  const value: SecretariaDataValue = {
    clients,
    vehicles,
    serviceOrders,
    invoices,
    readyOrders,
    addClient: (c) => setClients((prev) => [...prev, c]),
    addVehicle: (v) => setVehicles((prev) => [...prev, v]),
    addServiceOrder: (o) => setServiceOrders((prev) => [...prev, o]),
    openGenerate: (orderId) => setGenModal(orderId ?? "new"),
    viewDetail: (id) => setDetailId(id),
    markPaid: (id) => setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "Pagada" } : inv))),
    cancelInvoice: (id) => setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "Anulada" } : inv))),
  };

  const detailInvoice = invoices.find((inv) => inv.id === detailId) ?? null;

  return (
    <SecretariaDataContext.Provider value={value}>
      {children}

      {genModal !== null && (
        <GenerateModal
          readyOrders={readyOrders}
          preSelectedId={typeof genModal === "number" ? genModal : undefined}
          onClose={() => setGenModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      {detailInvoice && <DetailModal invoice={detailInvoice} onClose={() => setDetailId(null)} />}
    </SecretariaDataContext.Provider>
  );
}

// ── Generate Invoice Modal ────────────────────────────────────────────────────

interface GenerateModalProps {
  readyOrders: ReadyOrder[];
  preSelectedId?: number;
  onClose: () => void;
  onConfirm: (orderId: number, method: PayMethod) => string;
}

function GenerateModal({ readyOrders, preSelectedId, onClose, onConfirm }: GenerateModalProps) {
  const [orderId, setOrderId] = useState<number | "">(preSelectedId ?? (readyOrders[0]?.id ?? ""));
  const [method, setMethod] = useState<PayMethod | "">("");
  const [success, setSuccess] = useState<string | null>(null);

  const order = readyOrders.find((o) => o.id === orderId);
  const sub = order?.subtotal ?? 0;
  const iva = calcIva(sub);
  const tot = calcTotal(sub);

  function handleConfirm() {
    if (!order || !method) return;
    const num = onConfirm(order.id, method as PayMethod);
    setSuccess(num);
    setTimeout(onClose, 2400);
  }

  const methods: PayMethod[] = ["Efectivo", "Tarjeta", "Transferencia"];
  const methodIcon: Record<PayMethod, string> = { Efectivo: "💵", Tarjeta: "💳", Transferencia: "🏦" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 500, background: "#212125", borderRadius: 18, border: "1px solid #2a2a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>

        {success && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(13,13,15,0.95)", borderRadius: 18, gap: 16 }}>
            <div className="success-pop" style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 700 }}>Factura generada</div>
              <div style={{ color: "#4ade80", fontSize: 14, marginTop: 4 }}>{success}</div>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(90deg, #A31212, #7a0d0d)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Generar Factura</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>Selecciona la orden y el método de pago</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Orden finalizada</label>
            {readyOrders.length === 0 ? (
              <div style={{ background: "#252529", border: "1px solid #35353a", borderRadius: 8, padding: "12px 14px", color: "#5a5a65", fontSize: 13 }}>No hay órdenes listas para facturar.</div>
            ) : (
              <div style={{ position: "relative" }}>
                <select value={orderId} onChange={(e) => setOrderId(Number(e.target.value))}
                  style={{ background: "#252529", border: "1.5px solid #35353a", color: "#f0f0f2", borderRadius: 8, padding: "10px 36px 10px 14px", width: "100%", fontSize: 13, outline: "none", appearance: "none", cursor: "pointer" }}>
                  {readyOrders.map((o) => <option key={o.id} value={o.id}>{o.plate} — {o.client} — {fmtCLP(o.subtotal)}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5a5a65" }}>▾</span>
              </div>
            )}
          </div>

          {order && (
            <div style={{ background: "#252529", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 14 }}>{order.plate} · {order.model}</div>
                  <div style={{ color: "#8a8a96", fontSize: 12, marginTop: 2 }}>Cliente: {order.client}</div>
                  <div style={{ color: "#6a6a76", fontSize: 12 }}>Mecánico: {order.mechanic}</div>
                </div>
                <div style={{ color: "#5a5a65", fontSize: 11 }}>{order.completedDate}</div>
              </div>
              <div style={{ borderTop: "1px solid #35353a", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {order.services.map((s, i) => <span key={i} style={{ color: "#8a8a96", fontSize: 12 }}>• {s}</span>)}
              </div>
              <div style={{ borderTop: "1px solid #35353a", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8a8a96", fontSize: 13 }}>Subtotal</span>
                  <span style={{ color: "#c0c0c8", fontSize: 13 }}>{fmtCLP(sub)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#8a8a96", fontSize: 13 }}>IVA (19%)</span>
                  <span style={{ color: "#c0c0c8", fontSize: 13 }}>{fmtCLP(iva)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(163,18,18,0.08)", borderRadius: 6, padding: "8px 10px" }}>
                  <span style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>Total</span>
                  <span style={{ color: "#f0f0f2", fontSize: 15, fontWeight: 700 }}>{fmtCLP(tot)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "#8a8a96", fontSize: 11, fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Método de pago</label>
            <div style={{ display: "flex", gap: 10 }}>
              {methods.map((m) => {
                const active = method === m;
                return (
                  <button key={m} onClick={() => setMethod(m)}
                    style={{ flex: 1, background: active ? "rgba(163,18,18,0.15)" : "#252529", border: `1.5px solid ${active ? "#A31212" : "#35353a"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                    <span style={{ fontSize: 20 }}>{methodIcon[m]}</span>
                    <span style={{ color: active ? "#f0f0f2" : "#8a8a96", fontSize: 12, fontWeight: active ? 600 : 400 }}>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2a2e", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #35353a", borderRadius: 8, padding: "9px 20px", color: "#8a8a96", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!order || !method}
            style={{ background: !order || !method ? "#35353a" : "#A31212", border: "none", borderRadius: 8, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: !order || !method ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: !order || !method ? 0.5 : 1 }}
            onMouseEnter={(e) => { if (order && method) { e.currentTarget.style.background = "#c01515"; e.currentTarget.style.boxShadow = "0 0 16px rgba(163,18,18,0.4)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = !order || !method ? "#35353a" : "#A31212"; e.currentTarget.style.boxShadow = "none"; }}>
            Confirmar y generar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Detail Modal ──────────────────────────────────────────────────────

function DetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const statusColor: Record<string, string> = { Pagada: "#4ade80", Pendiente: "#facc15", Anulada: "#94a3b8" };
  const methodColor: Record<string, string> = { Efectivo: "#4ade80", Tarjeta: "#60a5fa", Transferencia: "#a78bfa" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto", color: "#111" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: "#0D0D0F", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>TALLER BONILLA</div>
            <div style={{ color: "#A31212", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Taller Automotriz</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f0f0f2", fontSize: 18, fontWeight: 800 }}>{invoice.number}</div>
            <div style={{ color: "#5a5a65", fontSize: 11 }}>{invoice.date}</div>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Facturado a</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{invoice.client}</div>
            </div>
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Vehículo</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{invoice.plate}</div>
              <div style={{ fontSize: 11, color: "#666" }}>{invoice.model}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9a9a9a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Servicios realizados</div>
            <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
              {invoice.services.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: i < invoice.services.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 13 }}>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" }}>
              <span>Subtotal</span><span>{fmtCLP(invoice.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" }}>
              <span>IVA (19%)</span><span>{fmtCLP(invoice.iva)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, borderTop: "1.5px solid #e0e0e0", paddingTop: 8 }}>
              <span>TOTAL</span><span style={{ color: "#A31212" }}>{fmtCLP(invoice.total)}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 4 }}>Método de pago</div>
              <span style={{ background: `${methodColor[invoice.paymentMethod]}22`, color: methodColor[invoice.paymentMethod], fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{invoice.paymentMethod}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 4 }}>Estado</div>
              <span style={{ background: `${statusColor[invoice.status]}22`, color: statusColor[invoice.status], fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{invoice.status}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
            <span>Mecánico: <strong style={{ color: "#333" }}>{invoice.mechanic}</strong></span>
            <span style={{ color: "#bbb", fontSize: 10 }}>Sistema Taller Bonilla</span>
          </div>
        </div>
        <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "9px 20px", color: "#555", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cerrar</button>
          <button onClick={() => window.print()} style={{ background: "#0D0D0F", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
