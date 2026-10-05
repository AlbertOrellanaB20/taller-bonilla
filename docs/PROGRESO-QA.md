# Progreso QA — Pasada completa antes de la demo al profesor

Última actualización: 2026-10-05 (en curso)

## Cómo retomar
Si esta sesión se corta, retómala con `claude --continue` y sigue desde la fase marcada como "en curso".

## Fase 0 — Salud del entorno
- [x] Variables en Vercel Production: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD — **las 5 existen**.
- [x] Último despliegue de producción: READY (dpl_Cui8naofgu9dJAg99tRBYgYPUFT5, commit 6b1eabc).
- [x] /api/keep-alive existe (src/app/api/keep-alive/route.ts) con cron diario en vercel.json (0 12 * * *).
- [x] Confirmar Supabase activo y datos del seed presentes — **confirmado**: usuario (5), cliente (10), vehiculo (11), orden_servicio (11), detalle_servicio (15), servicio (11), proveedor (6), repuesto (13), detalle_repuesto (16), factura (5). Los 3 usuarios clave de la demo (`erodriguez`, `narias`, `jrodas`) existen y están activos.
- [ ] Logs de runtime de Vercel: la herramienta del MCP falla con 403 (mismo límite de permisos de equipo ya reportado en sesiones anteriores) — no se puede revisar por esta vía. Se usará consola del navegador por pantalla en su lugar.

## Nota — interrupción por disco lleno (2026-10-05)
El disco C: del usuario se llenó al 100% a mitad de esta pasada (Descargas pesaba 30.6 GB). Se liberó la caché `.next` (438 MB) para poder seguir trabajando temporalmente, y el usuario liberó espacio manualmente después (quedaron ~5 GB libres). Ya se corrigió `npm install`, `tsc --noEmit` y `npm run build` sin errores tras esto. Commit de esta pasada: `5a4f107` (cambio de Resend a Gmail para el envío de facturas por correo).

## Fase 1 — Login y sesión
- [x] **Login de los 5 roles** (por el formulario real, contra `npm run dev` local): `aorellana`→`/admin`, `nguzman`→`/supervisora`, `erodriguez`→`/secretaria`, `narias`→`/mecanico`, `jrodas`→`/inventario`. Los 5 redirigen al panel correcto.
- [x] **Menú de cada rol coincide exacto con la tabla de permisos** del CLAUDE.md (verificado leyendo la navegación real de cada uno): Admin ve los 10 módulos; Supervisora solo Dashboard/Órdenes/Empleados/Reportes; Secretaria solo Dashboard/Clientes/Vehículos/Órdenes/Facturación; Mecánico solo Dashboard/Mis Órdenes; Inventario solo Dashboard/Repuestos/Proveedores.
- [x] **Protección cruzada por rol — las 20 combinaciones** (los 5 usuarios probando entrar a los 4 paneles ajenos escribiendo la URL directo): las 20 redirigen de vuelta a su propio panel. Ninguna dejó entrar.
- [x] **Cerrar sesión funciona de verdad**: después de "Cerrar sesión", intentar volver a `/admin` (u otro panel) sin loguearse redirige a `/login` — no era solo un cambio visual, la cookie de sesión se invalida.
- [x] **Mensajes de error de login**: contraseña incorrecta y usuario inexistente muestran el mismo mensaje genérico "Usuario o contraseña incorrectos." — correcto, no revela si el usuario existe (buena práctica de seguridad).

## Fase 2 — Pasada completa por rol
- [ ] Pendiente

## Fase 3 — Base de datos real y tiempo real
- [ ] Pendiente

## Fase 4 — Calidad general (consola, responsive, validación, factura, moneda, íconos)
- [ ] Pendiente

## Fase 5 — Limpieza de datos de prueba
- [ ] Pendiente

## Fase 6 — Documentación (guion-presentacion.md)
- [ ] Pendiente

## Fase 7 — Publicar a master
- [ ] Pendiente (ya se está trabajando directo en master, ver nota abajo)

## Nota sobre el flujo de ramas
Esta sesión viene trabajando directo en `master` desde conversaciones anteriores (no en
`worktree-portar-figma-nextjs`, que está desactualizada). Los commits de esta pasada de
QA se harán directo en `master`, igual que las correcciones previas — así que el paso
"fusionar la rama de trabajo a master" del plan original no aplica tal cual; en su lugar,
cada fase se commitea y empuja directo a master, y solo se detiene el push si algo crítico
queda roto.

## Errores encontrados en esta pasada

1. ~~**[BLOQUEA la función de correo] Falta correr el ALTER TABLE de `cliente.correo` en Supabase real.**~~ **RESUELTO** — el usuario corrió el `ALTER TABLE cliente ADD COLUMN IF NOT EXISTS correo VARCHAR(150);` en Supabase. Verificado por consulta directa: la columna existe (clientes existentes tienen `correo: null` porque se registraron antes de este campo — hay que llenárselo manualmente a cada uno desde el formulario de edición para poder probar el envío de factura por correo con ellos).
2. **[Revisar en Fase 4] Dashboard de Administrador muestra estadísticas en 0** ("Ingresos del mes: $0.00", "Órdenes activas: 0", "Vehículos en taller: 0", "Stock bajo: 0") mientras la tabla de "Órdenes recientes" debajo sí muestra órdenes reales en Pendiente/En Proceso y "Alertas de inventario" sí muestra repuestos con stock bajo real. Parece un bug en el cálculo de esas 4 tarjetas, no en los datos. Pendiente de investigar en Fase 4.
3. **[Cosmético] Enlace "¿Olvidaste tu contraseña?" en el login apunta a `#`** — no está implementado. El manual de usuario dice que no hay pantalla de "cambiar mi contraseña" todavía, así que es consistente, pero el enlace visible puede confundir. Considerar ocultarlo o implementarlo antes de la demo.
