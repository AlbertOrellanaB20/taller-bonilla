// TODO: reemplazar por datos reales de `repuesto` y `proveedor` (Supabase +
// Realtime) cuando se conecte este módulo — los triggers de descuento de
// stock ya existen en database/taller_bonilla_supabase.sql.

export interface Supplier {
  id: number;
  name: string;
  phone: string;
}

export interface Part {
  id: number;
  code: string;
  name: string;
  supplierId: number;
  stock: number;
  minStock: number;
  price: number;
}

export interface StockLog {
  partId: number;
  type: "entrada" | "salida";
  qty: number;
  reason: string;
  date: string;
}

export const SEED_SUPPLIERS: Supplier[] = [
  { id: 1, name: "AutoPartes Nacional S.A.", phone: "2234-5678" },
  { id: 2, name: "Distribuidora Oriente", phone: "2345-6789" },
  { id: 3, name: "Repuestos San Miguel", phone: "2456-7890" },
  { id: 4, name: "TechAuto Imports", phone: "2567-8901" },
  { id: 5, name: "Lubricantes El Salvador", phone: "2678-9012" },
];

export const SEED_PARTS: Part[] = [
  { id: 1, code: "FIL-001", name: "Filtro de aceite", supplierId: 1, stock: 8, minStock: 10, price: 4500 },
  { id: 2, code: "FIL-002", name: "Filtro de aire", supplierId: 1, stock: 14, minStock: 8, price: 6200 },
  { id: 3, code: "FIL-003", name: "Filtro de combustible", supplierId: 1, stock: 3, minStock: 6, price: 7800 },
  { id: 4, code: "FRE-001", name: "Pastillas freno delanteras", supplierId: 2, stock: 12, minStock: 8, price: 28000 },
  { id: 5, code: "FRE-002", name: "Pastillas freno traseras", supplierId: 2, stock: 5, minStock: 6, price: 22000 },
  { id: 6, code: "FRE-003", name: "Disco de freno", supplierId: 2, stock: 4, minStock: 4, price: 48000 },
  { id: 7, code: "ENC-001", name: "Bujías (x4)", supplierId: 3, stock: 20, minStock: 10, price: 12500 },
  { id: 8, code: "ENC-002", name: "Bobina de encendido", supplierId: 3, stock: 2, minStock: 4, price: 65000 },
  { id: 9, code: "ENC-003", name: "Sensor de oxígeno", supplierId: 4, stock: 3, minStock: 3, price: 85000 },
  { id: 10, code: "LUB-001", name: "Aceite motor 5W-30 (1L)", supplierId: 5, stock: 32, minStock: 20, price: 8900 },
  { id: 11, code: "LUB-002", name: "Aceite motor 10W-40 (1L)", supplierId: 5, stock: 28, minStock: 20, price: 7800 },
  { id: 12, code: "LUB-003", name: "Refrigerante (1L)", supplierId: 5, stock: 7, minStock: 10, price: 5500 },
  { id: 13, code: "LUB-004", name: "Líquido de frenos (500ml)", supplierId: 5, stock: 11, minStock: 8, price: 4200 },
  { id: 14, code: "SUS-001", name: "Amortiguador delantero", supplierId: 2, stock: 3, minStock: 4, price: 125000 },
  { id: 15, code: "SUS-002", name: "Amortiguador trasero", supplierId: 2, stock: 2, minStock: 4, price: 110000 },
  { id: 16, code: "TRA-001", name: "Correa de distribución", supplierId: 3, stock: 6, minStock: 4, price: 38000 },
  { id: 17, code: "TRA-002", name: "Correa serpentina", supplierId: 3, stock: 5, minStock: 4, price: 22000 },
  { id: 18, code: "ELE-001", name: "Batería 12V 55Ah", supplierId: 4, stock: 4, minStock: 3, price: 185000 },
  { id: 19, code: "ELE-002", name: "Termostato", supplierId: 4, stock: 1, minStock: 3, price: 28000 },
  { id: 20, code: "ELE-003", name: "Relay de arranque", supplierId: 4, stock: 6, minStock: 4, price: 9500 },
];

export const MONTHLY_USAGE = [
  { name: "Filtro de aceite", used: 34 },
  { name: "Aceite 5W-30", used: 28 },
  { name: "Bujías", used: 22 },
  { name: "Pastillas del.", used: 18 },
  { name: "Filtro de aire", used: 15 },
  { name: "Refrigerante", used: 12 },
  { name: "Líquido frenos", used: 9 },
];

export type StockStatus = "ok" | "low" | "critical";

export function stockStatus(p: Part): StockStatus {
  if (p.stock <= 0) return "critical";
  if (p.stock < p.minStock) return p.stock <= Math.ceil(p.minStock * 0.4) ? "critical" : "low";
  return "ok";
}

export const STATUS_STYLE: Record<StockStatus, { bg: string; color: string; border: string; label: string }> = {
  ok: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.25)", label: "OK" },
  low: { bg: "rgba(234,179,8,0.1)", color: "#facc15", border: "rgba(234,179,8,0.25)", label: "Stock bajo" },
  critical: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.25)", label: "Crítico" },
};

export function fmtPrice(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}
