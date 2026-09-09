// TODO: reemplazar por datos reales de `orden_servicio` filtrados por el
// mecánico autenticado (Supabase + Realtime) cuando se conecte este módulo.

export type OrderStatus = "Pendiente" | "En Proceso" | "Finalizado";

export interface MechanicOrder {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  client: string;
  clientPhone: string;
  services: string[];
  servicesDone: boolean[];
  status: OrderStatus;
  receivedDate: string;
  dueDate: string;
  notes: string;
  parts: { name: string; qty: number }[];
}

export const PARTS_CATALOG = [
  "Filtro de aceite",
  "Filtro de aire",
  "Filtro de combustible",
  "Pastillas de freno delanteras",
  "Pastillas de freno traseras",
  "Disco de freno",
  "Correa de distribución",
  "Bujías (x4)",
  "Líquido de frenos",
  "Refrigerante",
  "Aceite de motor 5W-30",
  "Aceite de motor 10W-40",
  "Correa serpentina",
  "Batería 12V",
  "Amortiguador delantero",
  "Amortiguador trasero",
  "Balancines",
  "Bobina de encendido",
  "Sensor de oxígeno",
  "Termostato",
];

export const INITIAL_ORDERS: MechanicOrder[] = [
  {
    id: 1,
    plate: "ABC-1234", brand: "Toyota", model: "Corolla", year: 2019,
    client: "Juan Pérez", clientPhone: "7123-4567",
    services: ["Cambio de aceite y filtro", "Diagnóstico electrónico", "Revisión de frenos"],
    servicesDone: [true, false, false],
    status: "En Proceso",
    receivedDate: "07/09/2026", dueDate: "09/09/2026",
    notes: "Cliente menciona ruido al frenar en reversa.",
    parts: [{ name: "Filtro de aceite", qty: 1 }, { name: "Aceite de motor 5W-30", qty: 4 }],
  },
  {
    id: 2,
    plate: "MNO-7890", brand: "Nissan", model: "Sentra", year: 2022,
    client: "Luis Torres", clientPhone: "7567-8901",
    services: ["Revisión de frenos", "Alineación y balanceo"],
    servicesDone: [false, false],
    status: "Pendiente",
    receivedDate: "07/09/2026", dueDate: "10/09/2026",
    notes: "",
    parts: [],
  },
  {
    id: 3,
    plate: "RST-4444", brand: "Subaru", model: "Forester", year: 2022,
    client: "Juan Pérez", clientPhone: "7123-4567",
    services: ["Cambio de aceite y filtro", "Revisión de suspensión"],
    servicesDone: [true, true],
    status: "Finalizado",
    receivedDate: "05/09/2026", dueDate: "07/09/2026",
    notes: "Suspensión delantera derecha con holgura. Revisado.",
    parts: [{ name: "Filtro de aceite", qty: 1 }, { name: "Aceite de motor 10W-40", qty: 4 }, { name: "Amortiguador delantero", qty: 1 }],
  },
  {
    id: 4,
    plate: "JKL-3456", brand: "Chevrolet", model: "Spark", year: 2018,
    client: "Ana García", clientPhone: "7456-7890",
    services: ["Cambio de bujías", "Cambio de filtro de combustible", "Revisión general"],
    servicesDone: [false, false, false],
    status: "Pendiente",
    receivedDate: "07/09/2026", dueDate: "09/09/2026",
    notes: "Falla de encendido en frío.",
    parts: [],
  },
];

export const TODAY_ORDERS = INITIAL_ORDERS.filter((o) => o.receivedDate === "07/09/2026");

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Pendiente: "En Proceso",
  "En Proceso": "Finalizado",
  Finalizado: null,
};

export const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  Pendiente: { bg: "rgba(234,179,8,0.1)", color: "#facc15", border: "rgba(234,179,8,0.25)" },
  "En Proceso": { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  Finalizado: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.25)" },
};

export const BTN_LABEL: Record<OrderStatus, string> = {
  Pendiente: "▶  Iniciar trabajo",
  "En Proceso": "✓  Marcar como Finalizado",
  Finalizado: "✓  Completado",
};
