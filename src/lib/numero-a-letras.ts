// Convierte un monto en dólares a letras para el pie de la factura,
// ej: 200.5 -> "DOSCIENTOS 50/100 DÓLARES". Cubre hasta 999,999.99, más que
// suficiente para las órdenes de un taller.

const UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DIECIS = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
const DECENAS = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const VEINTIS = ["VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function tresDigitos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DIECIS[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d === 2 && u > 0) partes.push(VEINTIS[u - 1]);
      else partes.push(u > 0 ? `${DECENAS[d]} Y ${UNIDADES[u]}` : DECENAS[d]);
    }
  }
  return partes.join(" ");
}

function enteroALetras(n: number): string {
  if (n === 0) return "CERO";
  if (n === 1) return "UN";

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (millones > 0) partes.push(millones === 1 ? "UN MILLÓN" : `${enteroALetras(millones)} MILLONES`);
  if (miles > 0) partes.push(miles === 1 ? "MIL" : `${tresDigitos(miles).replace(/UNO$/, "UN")} MIL`);
  if (resto > 0) partes.push(tresDigitos(resto));

  return partes.join(" ") || "CERO";
}

export function montoEnLetras(amount: number): string {
  const redondeado = Math.round(amount * 100) / 100;
  const entero = Math.floor(redondeado);
  const centavos = Math.round((redondeado - entero) * 100);
  const centavosStr = String(centavos).padStart(2, "0");
  return `${enteroALetras(entero)} ${centavosStr}/100 DÓLARES`;
}
