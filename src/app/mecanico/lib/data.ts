import type { OrderStatus } from "@/lib/domain/ordenes";

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Pendiente: "En Proceso",
  "En Proceso": "Finalizado",
  Finalizado: null,
  Entregado: null,
};

export const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  Pendiente: { bg: "rgba(234,179,8,0.1)", color: "#facc15", border: "rgba(234,179,8,0.25)" },
  "En Proceso": { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  Finalizado: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.25)" },
  Entregado: { bg: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
};

export const BTN_LABEL: Record<OrderStatus, string> = {
  Pendiente: "▶  Iniciar trabajo",
  "En Proceso": "✓  Marcar como Finalizado",
  Finalizado: "✓  Completado",
  Entregado: "✓  Entregado",
};
