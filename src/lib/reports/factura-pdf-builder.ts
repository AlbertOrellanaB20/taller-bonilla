import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { montoEnLetras } from "@/lib/numero-a-letras";
import { fmtUSD } from "@/lib/format";
import type { Invoice } from "@/lib/domain/facturacion";

const BRAND_RED: [number, number, number] = [163, 18, 18];
const DARK: [number, number, number] = [13, 13, 15];

/**
 * Silueta simple de un auto como marca de agua — el mismo espíritu del
 * <CarWatermark> que se ve en pantalla (src/app/secretaria/context.tsx).
 * jsPDF's GState/opacity no se renderiza de forma confiable en todos los
 * visores de PDF (se probó y el círculo salía sólido, no transparente), así
 * que en vez de opacidad se usa directamente un color muy pálido — se ve
 * igual de discreto sin depender de una función que no siempre pinta bien.
 * Se dibuja AL FINAL, ubicada cerca del pie de página, para no montarse
 * nunca sobre la tabla de conceptos ni sobre los totales.
 */
function drawCarWatermark(doc: jsPDF, y: number) {
  const cx = 105;
  const PALE_RED: [number, number, number] = [242, 214, 214];
  doc.setDrawColor(...PALE_RED);
  doc.setLineWidth(1.2);
  doc.lines(
    [
      [8, -16], [4, -6], [10, 0], [30, 0], [8, -2], [16, 10], [60, 2], [12, 6], [0, 2], [-158, 0],
    ],
    cx - 70,
    y + 6,
  );
  doc.circle(cx - 18, y + 8, 9, "S");
  doc.circle(cx + 50, y + 8, 9, "S");
}

/**
 * Construye el PDF de una factura. Sin directiva "use client"/"use server" a
 * propósito: jsPDF funciona igual en el navegador que en Node, así que esta
 * función la usan tanto el botón "Imprimir" (navegador, ver factura-pdf.ts)
 * como el envío por correo (servidor, ver src/lib/email/factura-email.ts) —
 * un solo lugar con el diseño de la factura, nunca dos copias que se puedan
 * desalinear.
 */
export function buildFacturaPdf(invoice: Invoice): jsPDF {
  const doc = new jsPDF();

  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("TALLER BONILLA", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_RED);
  doc.setFont("helvetica", "normal");
  doc.text("TALLER AUTOMOTRIZ · SONSONATE, EL SALVADOR", 14, 21);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.number, 196, 14, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(invoice.date, 196, 21, { align: "right" });

  let y = 42;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURADO A", 14, y);
  doc.text("VEHÍCULO", 110, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y += 6;
  doc.text(invoice.client, 14, y);
  doc.text(`${invoice.plate}`, 110, y);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  y += 5;
  if (invoice.clientDui) doc.text(`DUI: ${invoice.clientDui}`, 14, y);
  doc.text(`${invoice.model} ${invoice.vehicleYear || ""}`.trim(), 110, y);

  y += 6;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MECÁNICO", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(invoice.mechanic, 14, y);

  const rows: (string | number)[][] = [
    ...invoice.serviceLines.map((s) => ["Servicio", s.name, "1", fmtUSD(s.price)]),
    ...invoice.partLines.map((p) => ["Repuesto", p.name, String(p.qty), fmtUSD(p.subtotal)]),
  ];

  autoTable(doc, {
    startY: y + 8,
    head: [["Tipo", "Concepto", "Cant.", "Monto"]],
    body: rows,
    headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 2: { halign: "center" }, 3: { halign: "right" } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal", 140, finalY);
  doc.text(fmtUSD(invoice.subtotal), 196, finalY, { align: "right" });
  finalY += 6;
  doc.text("IVA (13%)", 140, finalY);
  doc.text(fmtUSD(invoice.iva), 196, finalY, { align: "right" });
  finalY += 8;
  doc.setDrawColor(220, 220, 220);
  doc.line(120, finalY - 4, 196, finalY - 4);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("TOTAL", 140, finalY);
  doc.text(fmtUSD(invoice.total), 196, finalY, { align: "right" });

  finalY += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(montoEnLetras(invoice.total), 14, finalY, { maxWidth: 182 });

  finalY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Método de pago: ${invoice.paymentMethod}`, 14, finalY);
  doc.text(`Estado: ${invoice.status}`, 196, finalY, { align: "right" });

  drawCarWatermark(doc, Math.min(Math.max(finalY + 24, 220), 260));

  return doc;
}
