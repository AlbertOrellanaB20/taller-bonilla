// Reglas de validación compartidas entre el formulario (feedback inmediato)
// y el servidor (para que ningún dato mal formado llegue a la base de datos
// sin importar por qué pantalla se creó el cliente).

export const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
export const TELEFONO_REGEX = /^\d{4}-\d{4}$/;
export const DUI_REGEX = /^\d{8}-\d$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-z][a-z0-9]{2,19}$/;
// Formato real usado en todo el sistema: letra(s) + dígitos - dígitos (ej.
// P123-456, igual que todos los vehículos ya registrados). El primer grupo
// de dígitos es opcional para no rechazar también el formato genérico
// letras-guión-dígitos (ej. ABC-1234) que usan otros países.
export const PLACA_REGEX = /^[A-Z]{1,3}\d{0,4}-\d{2,4}$/;
export const MARCA_MODELO_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 '.-]*$/;
export const COLOR_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
export const CODIGO_REPUESTO_REGEX = /^[A-Z0-9]{2,4}-\d{2,4}$/;
export const ANIO_MIN = 1980;

export const NOMBRE_MAX = 100;
export const DIRECCION_MAX = 150;
export const PROVEEDOR_NOMBRE_MAX = 100;
export const REPUESTO_NOMBRE_MAX = 80;

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
  email?: string;
}

export function validarCliente(input: ClienteInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const phone = input.phone.trim();
  const dui = input.dui.trim();
  const email = (input.email ?? "").trim();

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length < 3) errors.name = "El nombre es muy corto.";
  else if (name.length > NOMBRE_MAX) errors.name = `Máximo ${NOMBRE_MAX} caracteres.`;
  else if (!NOMBRE_REGEX.test(name)) errors.name = "Solo letras y espacios (sin números ni símbolos).";

  if (!phone) errors.phone = "El teléfono es obligatorio.";
  else if (!TELEFONO_REGEX.test(phone)) errors.phone = "Formato: 7123-4567 (8 dígitos).";

  if (dui && !DUI_REGEX.test(dui)) errors.dui = "Formato: 01234567-8.";

  if (email && !EMAIL_REGEX.test(email)) errors.email = "Correo inválido.";

  if (input.address.length > DIRECCION_MAX) errors.address = `Máximo ${DIRECCION_MAX} caracteres.`;

  return errors;
}

export interface VehiculoInput {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
}

const CURRENT_YEAR_PLUS_ONE = new Date().getFullYear() + 1;

export function validarVehiculo(input: VehiculoInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const plate = input.plate.trim().toUpperCase();
  const brand = input.brand.trim();
  const model = input.model.trim();
  const color = input.color.trim();

  if (!plate) errors.plate = "La placa es obligatoria.";
  else if (!PLACA_REGEX.test(plate)) errors.plate = "Formato de placa inválido (ej: P123-456).";

  if (!brand) errors.brand = "La marca es obligatoria.";
  else if (brand.length > 40) errors.brand = "Máximo 40 caracteres.";
  else if (!MARCA_MODELO_REGEX.test(brand)) errors.brand = "Formato inválido.";

  if (model && (model.length > 40 || !MARCA_MODELO_REGEX.test(model))) errors.model = "Formato inválido.";

  if (!input.year || input.year < ANIO_MIN || input.year > CURRENT_YEAR_PLUS_ONE) {
    errors.year = `Debe estar entre ${ANIO_MIN} y ${CURRENT_YEAR_PLUS_ONE}.`;
  }

  if (color && (color.length > 30 || !COLOR_REGEX.test(color))) errors.color = "Solo letras (ej: Rojo, Azul marino).";

  if (input.mileage < 0 || input.mileage > 999999) errors.mileage = "Debe estar entre 0 y 999,999.";

  return errors;
}

export interface ProveedorInput {
  name: string;
  phone: string;
}

export function validarProveedor(input: ProveedorInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (!name) errors.name = "El nombre del proveedor es obligatorio.";
  else if (name.length > PROVEEDOR_NOMBRE_MAX) errors.name = `Máximo ${PROVEEDOR_NOMBRE_MAX} caracteres.`;

  if (phone && !TELEFONO_REGEX.test(phone)) errors.phone = "Formato: 2234-5678 (8 dígitos).";

  return errors;
}

export interface RepuestoInput {
  code: string;
  name: string;
  supplierId: number;
  stock: number;
  minStock: number;
  price: number;
}

export function validarRepuesto(input: RepuestoInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();

  if (!code) errors.code = "El código es obligatorio.";
  else if (!CODIGO_REPUESTO_REGEX.test(code)) errors.code = "Formato: FIL-021 (letras/números, guión, números).";

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length > REPUESTO_NOMBRE_MAX) errors.name = `Máximo ${REPUESTO_NOMBRE_MAX} caracteres.`;

  if (!input.supplierId) errors.supplierId = "Selecciona un proveedor.";
  if (input.stock < 0) errors.stock = "No puede ser negativo.";
  if (input.minStock < 1) errors.minStock = "Debe ser al menos 1.";
  if (input.price <= 0) errors.price = "Debe ser mayor a 0.";

  return errors;
}

export interface UsuarioBasicoInput {
  name: string;
  email: string;
  username: string;
}

export function validarUsuarioBasico(input: UsuarioBasicoInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const username = input.username.trim();

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length > NOMBRE_MAX) errors.name = `Máximo ${NOMBRE_MAX} caracteres.`;
  else if (!NOMBRE_REGEX.test(name)) errors.name = "Solo letras y espacios.";

  if (!email) errors.email = "El correo es obligatorio.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Correo inválido.";

  if (!username) errors.username = "El usuario es obligatorio.";
  else if (!USERNAME_REGEX.test(username)) errors.username = "3-20 letras minúsculas o números, debe iniciar con letra.";

  return errors;
}
