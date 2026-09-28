// Reglas de validación compartidas entre el formulario (feedback inmediato)
// y el servidor (para que ningún dato mal formado llegue a la base de datos
// sin importar por qué pantalla se creó el cliente).

export const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
export const TELEFONO_REGEX = /^\d{4}-\d{4}$/;
export const DUI_REGEX = /^\d{8}-\d$/;

export const NOMBRE_MAX = 100;
export const DIRECCION_MAX = 150;

/** Mientras se escribe, va agregando el guión: "71234567" -> "7123-4567". */
export function formatTelefono(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/** Mientras se escribe, va agregando el guión: "012345678" -> "01234567-8". */
export function formatDui(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 9);
  return digits.length <= 8 ? digits : `${digits.slice(0, 8)}-${digits.slice(8)}`;
}

export interface ClienteInput {
  name: string;
  phone: string;
  address: string;
  dui: string;
}

export function validarCliente(input: ClienteInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const phone = input.phone.trim();
  const dui = input.dui.trim();

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length < 3) errors.name = "El nombre es muy corto.";
  else if (name.length > NOMBRE_MAX) errors.name = `Máximo ${NOMBRE_MAX} caracteres.`;
  else if (!NOMBRE_REGEX.test(name)) errors.name = "Solo letras y espacios (sin números ni símbolos).";

  if (!phone) errors.phone = "El teléfono es obligatorio.";
  else if (!TELEFONO_REGEX.test(phone)) errors.phone = "Formato: 7123-4567 (8 dígitos).";

  if (dui && !DUI_REGEX.test(dui)) errors.dui = "Formato: 01234567-8.";

  if (input.address.length > DIRECCION_MAX) errors.address = `Máximo ${DIRECCION_MAX} caracteres.`;

  return errors;
}
