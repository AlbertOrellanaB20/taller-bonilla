# Port del diseño de Figma a Next.js + Supabase Auth real

Este documento resume el trabajo hecho para portar las 5 pantallas aprobadas en Figma Make (`figma-reference/`) al proyecto Next.js real, reemplazando la navegación simulada y el login falso por autenticación real con Supabase.

Rama de trabajo: **`worktree-portar-figma-nextjs`** (ya subida a GitHub, sin tocar `main`/`master`).

## Contexto: por qué hubo un commit inicial

El repositorio no tenía ningún commit todavía cuando empecé (todo estaba sin trackear en `master`). Para poder aislar este trabajo en un git worktree (y no arriesgar tu copia de trabajo), primero hice un commit con el estado actual del proyecto tal como estaba, y luego construí todo el port en una rama aparte:

1. `79c3a70` — Commit inicial: scaffold de Next.js + Supabase, esquema de base de datos y el proyecto de referencia de Figma, tal como ya estaban.
2. `ecfa38b` — Todo el trabajo de este port (descrito abajo).

## 1. Login real con Supabase Auth

- La pantalla de login (`src/app/login/`) es fiel al diseño de Figma: panel de marca con las figuras animadas (engranajes, llave, tuerca, etc.) y el formulario con indicador de carga y mensaje de error.
- Ya **no hay usuarios hardcodeados**. El flujo real (`src/lib/actions/auth.ts`):
  1. El usuario escribe su **nombre de usuario** (no su correo).
  2. Un cliente de Supabase con la llave de servicio (`src/lib/supabase/admin.ts`, solo se usa en el servidor, nunca se manda al navegador) busca el correo asociado a ese nombre de usuario en la tabla `usuario`.
  3. Con ese correo, se autentica de verdad contra Supabase Auth (`signInWithPassword`).
  4. Se busca el rol del usuario (tabla `usuario` + `rol`) y se le redirige a su panel correspondiente.
- El botón "Cerrar sesión" en cada panel llama a un logout real (`supabase.auth.signOut()`).

## 2. Rutas protegidas por rol

- Next.js 16 le cambió el nombre a `middleware.ts` → ahora se llama **`proxy.ts`** (misma función, solo cambió la convención). Ya está actualizado.
- En `src/lib/supabase/middleware.ts` está la lógica que corre en cada visita:
  - Si no hay sesión → redirige a `/login`.
  - Si hay sesión y visita `/login` o `/` → lo manda a su panel según su rol.
  - Si intenta entrar a la sección de **otro rol** (ej. un Mecánico intentando abrir `/admin`) → lo regresa a su propio panel. Nadie puede "adivinar" una URL y entrar a un módulo que no le corresponde.
  - Si el usuario está desactivado (`activo = false`), se le cierra la sesión automáticamente.

## 3. Las 5 pantallas, portadas fielmente

Todas viven bajo rutas reales de Next.js (ya no es una sola página que cambia de "sección" con JavaScript):

| Rol | Ruta base | Pantallas incluidas |
|---|---|---|
| Administrador | `/admin` | Dashboard, Usuarios (el resto — Clientes, Vehículos, Órdenes, Inventario, Facturación, Empleados, Reportes, Configuración — quedan como "Próximamente", **igual que en el Figma original**, que tampoco los tenía diseñados) |
| Supervisora | `/supervisora` | Dashboard/Órdenes (asignar mecánico y cambiar estado), Empleados (solo lectura), Reportes |
| Secretario/a | `/secretaria` | Dashboard, Clientes, Vehículos, Órdenes de Servicio (con comprobante de recepción imprimible), Facturación (con modal para generar factura) |
| Mecánico | `/mecanico` | Dashboard, Mis Órdenes, con checklist de servicios y registro de repuestos usados |
| Inventario | `/inventario` | Dashboard, Repuestos (con ajuste de stock), Proveedores |

Todo el diseño (colores, animaciones, textos, layout) se copió tal cual del Figma aprobado — no se improvisó ningún estilo nuevo.

## 4. Bugs corregidos de paso

1. **Etiqueta de rol de Emely**: decía "Cajero" en `figma-reference/src/SupervisoraEmpleados.tsx` → corregido a "Secretario/a" (como pediste).
2. **El mismo bug en el SQL**: la política de seguridad (RLS) de facturación en `database/taller_bonilla_supabase.sql` decía `IN ('Administrador', 'Cajero')` — ese rol ya no existe en la tabla `rol` desde que se renombró a "Secretario/a", así que esa política nunca iba a aplicarle a nadie. Ya corregida.

## 5. ⚠️ Acción pendiente de tu parte: correr SQL nuevo en Supabase

Agregué una política de RLS que **es indispensable** para que el login funcione — sin ella, después de autenticar, el sistema no puede saber qué rol tiene el usuario (porque la tabla `usuario` tiene RLS activado y no había ninguna política que permitiera leer ni siquiera tu propia fila).

Está en `database/taller_bonilla_supabase.sql`, en la sección 8. Tienes que copiar y correr esto en el **SQL Editor de Supabase** (si ya corriste el script completo antes, solo hace falta correr esta parte nueva):

```sql
-- Cada usuario puede leer su propia fila en `usuario`. Es indispensable:
-- sin esto, después de iniciar sesión la app no puede saber qué rol tiene
-- el usuario (el login y el proxy/middleware de rutas dependen de esto).
CREATE POLICY "usuario_lee_su_propia_fila" ON usuario
FOR SELECT USING (auth_user_id = auth.uid());

-- El Administrador tiene control total sobre la tabla de usuarios.
CREATE POLICY "usuario_admin_control_total" ON usuario
FOR ALL USING (fn_rol_actual() = 'Administrador')
WITH CHECK (fn_rol_actual() = 'Administrador');

-- Solo Administrador y Secretario/a pueden ver todas las facturas
-- (nombre de rol corregido: antes decía 'Cajero').
CREATE POLICY "facturas_admin_secretaria" ON factura
FOR SELECT USING (fn_rol_actual() IN ('Administrador', 'Secretario/a'));
```

También necesitas agregar una variable de entorno nueva en tu `.env.local` (revisa `.env.local.example` actualizado):

```
SUPABASE_SERVICE_ROLE_KEY=
```

La encuentras en Supabase → Project Settings → API → `service_role`. **Nunca la subas a GitHub ni la pongas en el frontend** — solo se usa del lado del servidor para el login.

## 6. PWA (instalable desde el navegador)

- `src/app/manifest.ts` — nombre, colores, ícono.
- `src/app/icon.png` y `src/app/apple-icon.png` — íconos (generados a partir del logo; como el logo original es rectangular y no cuadrado, se ve un poco estirado como ícono — si quieres un ícono cuadrado más prolijo más adelante, lo puedo generar aparte).
- `public/sw.js` — service worker mínimo, solo lo necesario para que Chrome/Android lo reconozca como instalable. No guarda en caché nada con tu sesión ni datos en vivo, porque el sistema depende de Supabase.

## 7. Verificación que hice

- `npm run build` — compila sin errores.
- `npm run lint` — sin errores ni advertencias.
- Levanté el servidor de desarrollo con credenciales de prueba (falsas) y confirmé que:
  - `/` redirige a `/login`.
  - `/login` carga bien (código 200).
  - `/admin` sin sesión redirige correctamente a `/login` (nadie puede entrar sin loguearse).

No pude probar el login completo de principio a fin porque este entorno no tiene tus credenciales reales de Supabase — eso lo vas a poder probar tú en cuanto pongas tu `.env.local` con los datos reales y corras el SQL de la sección 5.

## 8. Lo que queda pendiente (fuera de lo que pediste ahora)

El contenido de cada módulo (Clientes, Vehículos, Órdenes, Facturación, Inventario, Reportes) todavía usa **datos de ejemplo guardados en memoria** — exactamente igual que en el diseño de Figma original, que tampoco estaba conectado a una base de datos real. Es decir: la navegación y el login ya son 100% reales, pero si guardas un cliente nuevo en la pantalla de Secretario/a, por ejemplo, ese dato se pierde al recargar la página porque todavía no está guardándose en Supabase.

Conectar cada módulo a las tablas reales (`cliente`, `vehiculo`, `orden_servicio`, `repuesto`, `factura`, etc.), con Supabase Realtime y las políticas de RLS completas para cada tabla según la tabla de permisos de `CLAUDE.md`, es un trabajo más grande que queda pendiente para una siguiente etapa.

## 9. Dónde está todo

- Rama: `worktree-portar-figma-nextjs`, ya subida a `origin` (tu GitHub).
- No toqué `main`/`master` — la decisión de cuándo fusionar esto queda en tus manos. Si quieres, puedo abrir el Pull Request cuando me digas.
