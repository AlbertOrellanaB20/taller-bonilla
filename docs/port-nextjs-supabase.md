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

### 5.1. Dos problemas más que aparecieron al probar con tu proyecto real (ya resueltos, ya los corriste)

Al intentar crear las cuentas reales encontré dos problemas más, **normales de un proyecto nuevo de Supabase**, no relacionados con el código:

1. **Permisos base (GRANT) faltantes.** Ninguna tabla se podía leer — ni siquiera con la llave de servicio — porque Postgres nunca tuvo el permiso base otorgado sobre las tablas (esto es distinto de RLS; Postgres lo revisa antes). Se corrigió con `GRANT ... TO anon, authenticated, service_role` (sección 8.0 del SQL).
2. **Catálogos bloqueados por RLS activado por defecto.** Supabase activa RLS automáticamente en tablas nuevas aunque el script no lo pida. Sin política, tablas como `rol` quedaban invisibles para cualquier usuario normal (solo la llave de servicio las veía). Como el login necesita leer `rol`, se agregaron políticas de lectura para usuarios autenticados en `rol`, `estado_orden`, `estado_factura`, `metodo_pago` y `servicio` (sección 8.0.1 del SQL).

Ambos ya los corriste en el SQL Editor de Supabase — quedan documentados aquí por si algún día recreas el proyecto desde cero con el script completo.

## 6. PWA (instalable desde el navegador)

- `src/app/manifest.ts` — nombre, colores, ícono.
- `src/app/icon.png` y `src/app/apple-icon.png` — íconos (generados a partir del logo; como el logo original es rectangular y no cuadrado, se ve un poco estirado como ícono — si quieres un ícono cuadrado más prolijo más adelante, lo puedo generar aparte).
- `public/sw.js` — service worker mínimo, solo lo necesario para que Chrome/Android lo reconozca como instalable. No guarda en caché nada con tu sesión ni datos en vivo, porque el sistema depende de Supabase.

## 7. Las 5 cuentas reales y la verificación completa que hice

Con tus credenciales reales de Supabase, creé las 5 cuentas del equipo (Supabase Auth + su fila en la tabla `usuario`) y probé el login de cada una de principio a fin, por HTTP real (no simulado) contra `npm run dev`.

### Usuarios

| Nombre | Usuario | Rol |
|---|---|---|
| Alberto Orellana | `aorellana` | Administrador |
| Nahomy Alexandra Guzmán | `nguzman` | Supervisora |
| Emely Lissbeth Rodríguez | `erodriguez` | Secretario/a |
| Noé Alexander Arias | `narias` | Mecánico |
| José Luis Rodas | `jrodas` | Inventario |

El correo interno de cada uno es `usuario@tallerbonilla.sv` (nunca se muestra en pantalla, el login es por nombre de usuario).

**Nota de seguridad:** este documento llegó a contener las 5 contraseñas reales en texto plano — no debió guardarse así en un archivo versionado. Las contraseñas ya fueron rotadas; las nuevas se entregaron solo por chat, nunca en un archivo de git. **Recomiendo que cada persona cambie su contraseña la primera vez que pueda** — hoy el sistema todavía no tiene una pantalla de "cambiar mi contraseña".

### Un bug real y grave que encontré (y ya corregí) al probar

Mientras probaba que cada rol entrara solo a su propio panel, encontré que **cualquier usuario logueado podía entrar al panel de cualquier otro rol** con solo escribir la URL (ej. Emely podía abrir `/admin` sin problema). Esto no tiene que ver con contraseñas ni con Supabase — era un bug real en cómo Next.js 16 ubica el archivo `proxy.ts`.

Next.js 16 exige que `proxy.ts` esté **dentro de `src/`** cuando el proyecto usa `src/app/` (como este) — antes lo tenía en la raíz del proyecto, que era donde vivía el `middleware.ts` viejo, pero la convención nueva es más estricta. Al estar en el lugar equivocado, Next.js nunca lo ejecutaba, así que la validación de "¿tu rol puede entrar aquí?" simplemente no corría nunca — solo quedaba en pie el chequeo de "¿hay alguien logueado?" (que no le importa el rol). Ya lo moví a `src/proxy.ts` y quedó confirmado en el build (`ƒ Proxy (Middleware)` aparece en la salida, antes no aparecía).

### Qué probé y confirmé, con las 5 cuentas reales

- **Login de cada uno de los 5** por el formulario real (no un atajo): usuario + contraseña → Supabase Auth real → cookie de sesión real → redirección al panel correcto.
- **Cada uno entra a su propio panel** (código 200): Alberto a `/admin`, Nahomy a `/supervisora`, Emely a `/secretaria`, Noé a `/mecanico`, José Luis a `/inventario`.
- **Ningún rol puede entrar al panel de otro** (después de corregir el bug de `proxy.ts`): probé las 5 combinaciones cruzadas y todas redirigen correctamente a su propio panel en vez de dejarlos entrar.
- `npm run build` — compila sin errores, y ahora muestra `ƒ Proxy (Middleware)` confirmando que el proxy está activo.
- `npm run lint` — sin errores ni advertencias.
- Sin sesión, cualquier panel redirige a `/login`.

**Todo funcionó** una vez corregido el bug de ubicación de `proxy.ts`. No quedó nada pendiente de esta prueba.

## 8. Lo que queda pendiente (fuera de lo que pediste ahora)

El contenido de cada módulo (Clientes, Vehículos, Órdenes, Facturación, Inventario, Reportes) todavía usa **datos de ejemplo guardados en memoria** — exactamente igual que en el diseño de Figma original, que tampoco estaba conectado a una base de datos real. Es decir: la navegación y el login ya son 100% reales, pero si guardas un cliente nuevo en la pantalla de Secretario/a, por ejemplo, ese dato se pierde al recargar la página porque todavía no está guardándose en Supabase.

Conectar cada módulo a las tablas reales (`cliente`, `vehiculo`, `orden_servicio`, `repuesto`, `factura`, etc.), con Supabase Realtime y las políticas de RLS completas para cada tabla según la tabla de permisos de `CLAUDE.md`, es un trabajo más grande que queda pendiente para una siguiente etapa.

## 9. Dónde está todo

- Rama: `worktree-portar-figma-nextjs`, ya subida a `origin` (tu GitHub).
- No toqué `main`/`master` — la decisión de cuándo fusionar esto queda en tus manos. Si quieres, puedo abrir el Pull Request cuando me digas.
