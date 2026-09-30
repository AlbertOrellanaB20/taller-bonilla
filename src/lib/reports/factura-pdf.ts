"use client";

import { buildFacturaPdf } from "./factura-pdf-builder";
import type { Invoice } from "@/lib/domain/facturacion";

export function exportFacturaPdf(invoice: Invoice) {
  const doc = buildFacturaPdf(invoice);
  doc.save(`${invoice.number}.pdf`);
}
