"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_RED: [number, number, number] = [163, 18, 18];
const DARK: [number, number, number] = [13, 13, 15];

function timestamp(): string {
  return new Date().toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });
}

export function exportReportePdf(title: string, subtitle: string, columns: string[], rows: (string | number)[][]) {
  const doc = new jsPDF();

  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TALLER BONILLA", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_RED);
  doc.setFont("helvetica", "normal");
  doc.text("TALLER AUTOMOTRIZ", 14, 20);
  doc.setTextColor(200, 200, 200);
  doc.text(timestamp(), 196, 20, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 38);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, 14, 44);

  autoTable(doc, {
    startY: 50,
    head: [columns],
    body: rows.map((r) => r.map(String)),
    headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}

export async function exportReporteExcel(title: string, columns: string[], rows: (string | number)[][]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Taller Bonilla";
  const sheet = workbook.addWorksheet(title.slice(0, 31));

  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "TALLER BONILLA — " + title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D0D0F" } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, columns.length);
  const dateCell = sheet.getCell(2, 1);
  dateCell.value = `Generado: ${timestamp()}`;
  dateCell.font = { italic: true, size: 10, color: { argb: "FF5A5A65" } };

  const headerRow = sheet.getRow(4);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA31212" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 22;

  rows.forEach((r, ri) => {
    const row = sheet.getRow(5 + ri);
    r.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
    });
  });

  sheet.columns.forEach((col, i) => {
    const header = columns[i] ?? "";
    const longest = rows.reduce((max, r) => Math.max(max, String(r[i] ?? "").length), header.length);
    col.width = Math.min(Math.max(longest + 4, 12), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
