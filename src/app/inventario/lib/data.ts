import type { Part } from "@/lib/domain/inventario";

export type { Part, Supplier } from "@/lib/domain/inventario";
export { fmtUSD as fmtPrice } from "@/lib/format";

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
