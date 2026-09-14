export const IVA_RATE = 0.13; // IVA de El Salvador

export function calcIva(subtotal: number): number {
  return Math.round(subtotal * IVA_RATE * 100) / 100;
}

export function calcTotal(subtotal: number): number {
  return Math.round((subtotal + calcIva(subtotal)) * 100) / 100;
}

export function fmtUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-09-07" (fecha/timestamp de Postgres) -> "07/09/2026" */
export function toDMY(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** input[type=date] "2026-09-07" tal cual (ya viene en ese formato) */
export function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Hoy en formato "07/09/2026", para comparar contra fechas ya formateadas. */
export function todayDMY(): string {
  return toDMY(new Date().toISOString());
}

export function toInputDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y}`;
}
