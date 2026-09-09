// Shared types and mock data for the Secretario/a dashboard

export type PayMethod = "Efectivo" | "Tarjeta" | "Transferencia";
export type InvoiceStatus = "Pagada" | "Pendiente" | "Anulada";

export interface Invoice {
  id: number;
  number: string;
  orderId: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  services: string[];
  subtotal: number;
  iva: number;
  total: number;
  paymentMethod: PayMethod;
  status: InvoiceStatus;
  date: string;
}

export interface ReadyOrder {
  id: number;
  plate: string;
  model: string;
  client: string;
  mechanic: string;
  services: string[];
  subtotal: number;
  completedDate: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
  dui: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  clientId: number;
}

export interface ServiceOrder {
  id: number;
  vehicleId: number;
  services: string[];
  receivedDate: string;
  estimatedDelivery: string;
}

export const SERVICE_CATALOG = [
  "Cambio de aceite y filtro",
  "Revisión de frenos",
  "Alineación y balanceo",
  "Diagnóstico electrónico",
  "Servicio de aire acondicionado",
  "Cambio de batería",
  "Revisión de suspensión",
  "Cambio de correa de distribución",
  "Cambio de bujías",
  "Cambio de filtro de combustible",
  "Revisión general",
  "Lavado y detallado",
];

export const TODAY = "07/09/2026";

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_CLIENTS: Client[] = [
  { id: 1, name: "Juan Pérez",    phone: "7123-4567", address: "Col. Escalón, San Salvador",    dui: "01234567-8" },
  { id: 2, name: "María López",   phone: "7234-5678", address: "Res. Jardines, Santa Tecla",    dui: "09876543-2" },
  { id: 3, name: "Roberto Díaz",  phone: "7345-6789", address: "Urb. Las Palmas, Soyapango",    dui: "05678901-3" },
  { id: 4, name: "Ana García",    phone: "7456-7890", address: "Col. San Benito, San Salvador", dui: "03456789-0" },
  { id: 5, name: "Luis Torres",   phone: "7567-8901", address: "Mejicanos, San Salvador",       dui: "07890123-4" },
  { id: 6, name: "Carmen Ruiz",   phone: "7678-9012", address: "Col. Médica, San Salvador",     dui: "02345678-9" },
  { id: 7, name: "Diego Méndez",  phone: "7789-0123", address: "Soyapango, San Salvador",       dui: "08901234-5" },
  { id: 8, name: "Paula Moreno",  phone: "7890-1234", address: "Antiguo Cuscatlán",             dui: "06789012-3" },
];

export const SEED_VEHICLES: Vehicle[] = [
  { id: 1, plate: "ABC-1234", brand: "Toyota",    model: "Corolla",  year: 2019, color: "Blanco",  mileage: 45000, clientId: 1 },
  { id: 2, plate: "DEF-5678", brand: "Ford",      model: "Ranger",   year: 2021, color: "Gris",    mileage: 32000, clientId: 2 },
  { id: 3, plate: "GHI-9012", brand: "Hyundai",   model: "Tucson",   year: 2020, color: "Negro",   mileage: 58000, clientId: 3 },
  { id: 4, plate: "JKL-3456", brand: "Chevrolet", model: "Spark",    year: 2018, color: "Rojo",    mileage: 72000, clientId: 4 },
  { id: 5, plate: "MNO-7890", brand: "Nissan",    model: "Sentra",   year: 2022, color: "Azul",    mileage: 18000, clientId: 5 },
  { id: 6, plate: "PQR-1111", brand: "Honda",     model: "Civic",    year: 2020, color: "Plata",   mileage: 41000, clientId: 6 },
  { id: 7, plate: "STU-2222", brand: "Mazda",     model: "3",        year: 2023, color: "Rojo",    mileage: 9500,  clientId: 7 },
  { id: 8, plate: "VWX-3333", brand: "Kia",       model: "Sportage", year: 2021, color: "Gris",    mileage: 27000, clientId: 8 },
  { id: 9, plate: "RST-4444", brand: "Subaru",    model: "Forester", year: 2022, color: "Verde",   mileage: 21000, clientId: 1 },
];

export const SEED_SERVICE_ORDERS: ServiceOrder[] = [
  { id: 1, vehicleId: 1, services: ["Cambio de aceite y filtro", "Diagnóstico electrónico"],  receivedDate: "07/09/2026", estimatedDelivery: "09/09/2026" },
  { id: 2, vehicleId: 5, services: ["Revisión de frenos", "Alineación y balanceo"],           receivedDate: "07/09/2026", estimatedDelivery: "10/09/2026" },
  { id: 3, vehicleId: 3, services: ["Servicio de aire acondicionado"],                        receivedDate: "06/09/2026", estimatedDelivery: "08/09/2026" },
  { id: 4, vehicleId: 7, services: ["Alineación y balanceo", "Cambio de bujías"],             receivedDate: "05/09/2026", estimatedDelivery: "07/09/2026" },
];

export const SEED_READY_ORDERS: ReadyOrder[] = [
  { id: 10, plate: "RST-4444", model: "Subaru Forester",      client: "Juan Pérez",    mechanic: "Noé Arias",     services: ["Cambio de aceite y filtro", "Revisión de frenos"],            subtotal: 145000, completedDate: "07/09/2026" },
  { id: 11, plate: "UVW-5555", model: "Volkswagen Tiguan",    client: "Sandra Pérez",  mechanic: "Pedro Salazar", services: ["Servicio de aire acondicionado", "Recarga de refrigerante"],   subtotal: 320000, completedDate: "06/09/2026" },
  { id: 12, plate: "XYZ-6666", model: "Mitsubishi Outlander", client: "Ricardo Flores",mechanic: "José Ramírez",  services: ["Revisión general", "Cambio de filtro de combustible"],        subtotal: 85000,  completedDate: "06/09/2026" },
];

export const SEED_INVOICES: Invoice[] = [
  { id: 51, number: "FAC-0051", orderId: 3,  plate: "GHI-9012", model: "Hyundai Tucson",    client: "Roberto Díaz",  mechanic: "Pedro Salazar", services: ["Revisión de frenos", "Cambio de pastillas"],             subtotal: 180000, iva: 34200,  total: 214200,  paymentMethod: "Tarjeta",       status: "Pagada",   date: "07/09/2026" },
  { id: 50, number: "FAC-0050", orderId: 4,  plate: "JKL-3456", model: "Chevrolet Spark",   client: "Ana García",    mechanic: "Noé Arias",     services: ["Cambio de aceite", "Filtro de aire"],                   subtotal: 95000,  iva: 18050,  total: 113050,  paymentMethod: "Efectivo",      status: "Pagada",   date: "07/09/2026" },
  { id: 49, number: "FAC-0049", orderId: 7,  plate: "STU-2222", model: "Mazda 3",           client: "Diego Méndez",  mechanic: "Pedro Salazar", services: ["Alineación y balanceo", "Rotación de neumáticos"],      subtotal: 220000, iva: 41800,  total: 261800,  paymentMethod: "Transferencia", status: "Pendiente", date: "07/09/2026" },
  { id: 48, number: "FAC-0048", orderId: 1,  plate: "ABC-1234", model: "Toyota Corolla",    client: "Juan Pérez",    mechanic: "Noé Arias",     services: ["Diagnóstico electrónico", "Cambio de aceite"],          subtotal: 160650, iva: 30524,  total: 191174,  paymentMethod: "Tarjeta",       status: "Pagada",   date: "07/09/2026" },
  { id: 47, number: "FAC-0047", orderId: 8,  plate: "VWX-3333", model: "Kia Sportage",      client: "Paula Moreno",  mechanic: "José Ramírez",  services: ["Suspensión delantera", "Alineación"],                   subtotal: 232000, iva: 44080,  total: 276080,  paymentMethod: "Transferencia", status: "Pagada",   date: "07/09/2026" },
  { id: 46, number: "FAC-0046", orderId: 2,  plate: "DEF-5678", model: "Ford Ranger",       client: "María López",   mechanic: "José Ramírez",  services: ["Revisión de motor", "Cambio de correa"],                subtotal: 280000, iva: 53200,  total: 333200,  paymentMethod: "Transferencia", status: "Pagada",   date: "06/09/2026" },
  { id: 45, number: "FAC-0045", orderId: 5,  plate: "MNO-7890", model: "Nissan Sentra",     client: "Luis Torres",   mechanic: "José Ramírez",  services: ["Cambio de aceite", "Revisión general"],                 subtotal: 75000,  iva: 14250,  total: 89250,   paymentMethod: "Efectivo",      status: "Pendiente", date: "06/09/2026" },
  { id: 44, number: "FAC-0044", orderId: 6,  plate: "PQR-1111", model: "Honda Civic",       client: "Carmen Ruiz",   mechanic: "Noé Arias",     services: ["Aire acondicionado", "Refrigerante"],                   subtotal: 195000, iva: 37050,  total: 232050,  paymentMethod: "Tarjeta",       status: "Pagada",   date: "05/09/2026" },
  { id: 43, number: "FAC-0043", orderId: 9,  plate: "AAA-9999", model: "Kia Picanto",       client: "Héctor Fuentes",mechanic: "Pedro Salazar", services: ["Frenos", "Suspensión"],                                 subtotal: 310000, iva: 58900,  total: 368900,  paymentMethod: "Transferencia", status: "Anulada",  date: "04/09/2026" },
  { id: 42, number: "FAC-0042", orderId: 0,  plate: "BBB-8888", model: "Suzuki Swift",      client: "Mónica Reyes",  mechanic: "Noé Arias",     services: ["Cambio de aceite", "Cambio de bujías"],                 subtotal: 150000, iva: 28500,  total: 178500,  paymentMethod: "Efectivo",      status: "Pagada",   date: "04/09/2026" },
];

// ── Counters ──────────────────────────────────────────────────────────────────
let _nextInvoiceNum = 52;
export function nextInvoiceNumber(): string {
  return `FAC-${String(_nextInvoiceNum++).padStart(4, "0")}`;
}

let _nextOrderId = 5;
export function nextServiceOrderId(): number { return _nextOrderId++; }

let _nextClientId = 9;
export function nextClientId(): number { return _nextClientId++; }

let _nextVehicleId = 10;
export function nextVehicleId(): number { return _nextVehicleId++; }

// ── Helpers ───────────────────────────────────────────────────────────────────
export function calcIva(subtotal: number) { return Math.round(subtotal * 0.19); }
export function calcTotal(subtotal: number) { return subtotal + calcIva(subtotal); }
export function fmtCLP(n: number) { return `$${Math.round(n).toLocaleString("es-CL")}`; }

export function daysDiff(from: string, to: string): number {
  const parse = (s: string) => {
    const [d, m, y] = s.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
  };
  return Math.max(0, Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000));
}

export function toInputDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y}`;
}
