# Guía de datos y base de datos — Sistema Taller Bonilla

Esta guía explica, en español simple, cómo está armada la base de datos del sistema y qué pasa "por dentro" cada vez que alguien hace algo en la pantalla. Está pensada para quien la esté aprendiendo desde cero — no hace falta saber programar para seguirla, solo tener paciencia.

Todo lo que describe este documento ya está corriendo en el código real del proyecto (no es un plan, es lo que hay).

---

## 1. Las tablas de la base de datos, explicadas una por una

La base de datos vive en Supabase (Postgres) y su "plano" completo está en `database/taller_bonilla_supabase.sql`. Estas son las 15 tablas:

| Tabla | Para qué sirve |
|---|---|
| `rol` | Catálogo fijo con los 5 roles del sistema (Administrador, Supervisora, Secretario/a, Mecánico, Inventario). |
| `usuario` | Una fila por cada persona que puede iniciar sesión: nombre, correo (interno, nunca se muestra), nombre de usuario, a qué rol pertenece, si está activo. Se conecta con el sistema de login real de Supabase (`auth_user_id`) — la contraseña NUNCA se guarda aquí, Supabase la maneja por separado y ya cifrada. |
| `empleado` | Solo para el personal que puede ser **asignado a una orden** (hoy, los mecánicos): su código y especialidad. Se conecta 1 a 1 con `usuario`. |
| `cliente` | Los dueños de vehículos: nombre, teléfono, dirección, DUI. |
| `vehiculo` | Un vehículo por fila: placa, marca, modelo, año, color, kilometraje, y de qué cliente es. |
| `orden_servicio` | El corazón del sistema: una fila por cada vez que un vehículo entra al taller. Guarda el vehículo, el mecánico asignado, el estado (Pendiente/En Proceso/Finalizado/Entregado), las fechas, y el `total` (que la base de datos calcula sola, ver sección 3). |
| `detalle_servicio` | Qué servicios se pidieron en una orden (una fila por servicio), con el precio que se cobró ese día y si el mecánico ya lo marcó como completado. |
| `servicio` | Catálogo de servicios que ofrece el taller (Cambio de aceite, Frenos, etc.) con su precio base. |
| `proveedor` | Quién le vende los repuestos al taller: nombre, teléfono, y si sigue activo o no. |
| `repuesto` | El inventario: código, nombre, de qué proveedor, cuánto stock hay, cuál es el mínimo, y el precio. |
| `detalle_repuesto` | Qué repuestos se usaron en una orden (una fila por repuesto), con la cantidad y el precio de ese momento. Cada fila nueva aquí **descuenta el stock sola** (ver sección 3). |
| `factura` | Una factura por cada orden ya cobrada: número, subtotal, IVA, total, método de pago, estado (Pagada/Pendiente/Anulada). |
| `estado_orden` | Catálogo fijo: Pendiente, En Proceso, Finalizado, Entregado. |
| `estado_factura` | Catálogo fijo: Pagada, Pendiente, Anulada. |
| `metodo_pago` | Catálogo fijo: Efectivo, Tarjeta, Transferencia. |

---

## 2. Qué pantalla toca qué tabla

Todas las funciones que hablan con la base de datos viven en `src/lib/domain/` — un archivo por tema. Cuando alguien hace clic en algo, esa es la función que se ejecuta.

### Administrador
El Administrador reutiliza exactamente las mismas pantallas y funciones que los demás roles (por eso no aparece repetido abajo) — la diferencia es que él puede entrar a todos los módulos, mientras que cada rol solo ve el suyo. Lo único exclusivo de él es la gestión de usuarios:

| Acción en pantalla | Función que la ejecuta | Tabla(s) que cambian | ¿Dispara algo automático? | Cómo verlo en Supabase |
|---|---|---|---|---|
| Crear usuario nuevo | `src/lib/domain/usuarios.ts` → `crearUsuario()` | Crea la cuenta de acceso en Supabase Auth (no es una tabla nuestra) + `usuario` (+ `empleado` si el rol es Mecánico) | No | `select * from usuario order by id_usuario desc limit 1;` y en el panel de Supabase: **Authentication → Users** |
| Editar usuario / cambiar contraseña | `actualizarUsuario()` | Supabase Auth + `usuario` (+ `empleado`) | No | mismo `select` de arriba, columna `updated_at` en Auth |
| Activar / desactivar usuario | `toggleActivoUsuario()` | `usuario.activo` | No (pero bloquea el login la próxima vez que esa persona intente entrar) | `select nombre_usuario, activo from usuario;` |

### Secretario/a — puerta de entrada del taller

| Acción en pantalla | Función (`src/lib/domain/...`) | Tabla(s) | Trigger que dispara | Verificar en Supabase |
|---|---|---|---|---|
| Registrar cliente nuevo | `clientes-vehiculos.ts` → `crearCliente()` | INSERT en `cliente` | Ninguno | `select * from cliente order by id_cliente desc limit 1;` |
| Registrar vehículo nuevo | `crearVehiculo()` | INSERT en `vehiculo` | Ninguno | `select * from vehiculo order by id_vehiculo desc limit 1;` |
| Crear orden de servicio (recepción) | `ordenes.ts` → `crearOrden()` | INSERT en `orden_servicio` + un INSERT en `detalle_servicio` por cada servicio marcado | `trg_detalle_servicio_after_insert` recalcula `orden_servicio.total` | `select * from orden_servicio order by id_orden_servicio desc limit 1;` luego `select * from detalle_servicio where id_orden_servicio = <ese id>;` |
| Generar factura | `facturacion.ts` → `generarFactura()` (llama a la función `fn_generar_factura` de la base de datos) | INSERT en `factura` + UPDATE en `orden_servicio` (estado pasa a "Entregado") | Es una función transaccional: si algo falla a la mitad, Postgres deshace todo | `select * from factura order by id_factura desc limit 1;` |
| Marcar factura como pagada / anular | `marcarFacturaPagada()` / `anularFactura()` | UPDATE en `factura.id_estado_factura` | Ninguno | `select numero_factura, id_estado_factura from factura;` |

### Mecánico — solo sus propias órdenes

| Acción en pantalla | Función | Tabla(s) | Trigger que dispara | Verificar en Supabase |
|---|---|---|---|---|
| Ver "Mis Órdenes" | `ordenes.ts` → `listOrdenesMecanico()` | Solo lectura | — | — |
| Avanzar estado (Iniciar trabajo / Finalizar) | `avanzarEstadoOrden()` | UPDATE `orden_servicio.id_estado_orden` (y `fecha_entrega_real` si pasa a Finalizado) | Ninguno | `select id_estado_orden, fecha_entrega_real from orden_servicio where id_orden_servicio = <id>;` |
| Marcar un servicio como completado (checklist) | `marcarServicioCompletado()` | UPDATE `detalle_servicio.completado` | Ninguno (no afecta precio) | `select completado from detalle_servicio where id_orden_servicio = <id>;` |
| Agregar un repuesto usado | `agregarRepuestoAOrden()` | INSERT en `detalle_repuesto` | `trg_detalle_repuesto_after_insert`: descuenta `repuesto.stock_actual` **y** recalcula `orden_servicio.total`, en la misma operación | `select stock_actual from repuesto where id_repuesto = <id>;` (antes y después) |

### Supervisora — supervisa y reasigna

| Acción en pantalla | Función | Tabla(s) | Trigger | Verificar en Supabase |
|---|---|---|---|---|
| Reasignar mecánico | `ordenes.ts` → `reasignarMecanico()` | UPDATE `orden_servicio.id_empleado` | Ninguno | `select id_empleado from orden_servicio where id_orden_servicio = <id>;` |
| Cambiar estado de una orden | `cambiarEstadoOrden()` | UPDATE `orden_servicio.id_estado_orden` | Ninguno | igual que arriba |
| Ver Empleados (solo lectura) | `empleados.ts` → `listEmpleados()` | Solo lectura | — | — |
| Ver Reportes | `reportes.ts` → `getSupervisoraReportes()` | Solo lectura (agrupa datos de `detalle_servicio` y `orden_servicio`) | — | — |

### Inventario

| Acción en pantalla | Función | Tabla(s) | Trigger | Verificar en Supabase |
|---|---|---|---|---|
| Ajustar stock (entrada/salida manual) | `inventario.ts` → `ajustarStock()` | UPDATE `repuesto.stock_actual` | Ninguno (esto es un ajuste manual, no pasa por una orden) | `select stock_actual from repuesto where id_repuesto = <id>;` |
| Nuevo repuesto | `crearRepuesto()` | INSERT en `repuesto` | Ninguno | `select * from repuesto order by id_repuesto desc limit 1;` |
| Nuevo proveedor | `crearProveedor()` | INSERT en `proveedor` | Ninguno | `select * from proveedor order by id_proveedor desc limit 1;` |
| Activar / desactivar proveedor | `toggleActivoProveedor()` | UPDATE `proveedor.activo` | Ninguno (pero ya no aparece en el selector al crear un repuesto nuevo) | `select nombre, activo from proveedor;` |

---

## 3. Lo que la base de datos hace sola (triggers)

Estas reglas viven directo en Postgres (no en el código de Next.js), así que se cumplen sin importar desde dónde se inserten los datos:

1. **El total de una orden se recalcula solo.** Cada vez que se agrega o se quita un servicio (`detalle_servicio`) o un repuesto (`detalle_repuesto`), la función `fn_actualizar_total_orden` vuelve a sumar todo y actualiza `orden_servicio.total`. Nadie hace esa suma a mano.
2. **El stock baja y sube solo.** Insertar una fila en `detalle_repuesto` baja `repuesto.stock_actual` esa misma cantidad; borrarla la devuelve. Si no hay suficiente stock, la base de datos rechaza la operación con un mensaje claro en vez de dejar el stock en negativo.
3. **Generar una factura es una sola operación segura.** `fn_generar_factura` crea la factura y marca la orden como "Entregado" en un solo paso — si algo falla a la mitad, no queda ni una factura huérfana ni una orden a medio actualizar.

---

## 4. El flujo completo de una visita, de principio a fin

1. **Llega el vehículo → Secretario/a** registra al cliente (si es nuevo) y el vehículo (si es nuevo), y crea la **orden de servicio** con los servicios que pidió el cliente y una fecha estimada de entrega. El sistema imprime un comprobante de recepción. → tablas `cliente`, `vehiculo`, `orden_servicio`, `detalle_servicio`.
2. **Supervisora** ve la orden en su tabla (llega en tiempo real, sin recargar), la asigna a un mecánico y la pasa a "En Proceso". → `orden_servicio.id_empleado` y `.id_estado_orden`.
3. **Mecánico** ve la orden en "Mis Órdenes", marca cada servicio conforme lo hace, y agrega los repuestos que va usando (el stock baja solo). → `detalle_servicio.completado`, `detalle_repuesto`, `repuesto.stock_actual`.
4. Cuando termina, el Mecánico (o la Supervisora) marca la orden como **"Finalizado"**.
5. **Secretario/a** la ve en "listas para facturar" y genera la factura eligiendo el método de pago. La orden pasa sola a **"Entregado"**. → `factura`, `orden_servicio.id_estado_orden`.
6. Cuando el cliente paga, Secretario/a la marca como **"Pagada"**. → `factura.id_estado_factura`.

---

## 5. Demo para el profesor — 5 pruebas paso a paso

Antes de empezar: abre el sistema en una pestaña y el **Table Editor** de Supabase en otra, para ver los cambios reflejados al instante.

### Prueba 1 — El login y la protección por rol funcionan de verdad
1. Inicia sesión como `narias` (Mecánico).
2. En la barra de direcciones, escribe la URL de otro panel, por ejemplo `/admin`.
3. **Resultado esperado:** el sistema te regresa solo a `/mecanico` — nunca deja entrar a un panel de otro rol, aunque se sepa la dirección exacta.

### Prueba 2 — Registrar un cliente y un vehículo se guarda de verdad
1. Inicia sesión como `erodriguez` (Secretario/a) → **Clientes** → **+ Nuevo Cliente** → llena el formulario y guarda.
2. Ve a **Vehículos** → **+ Nuevo Vehículo** → regístraselo a ese mismo cliente.
3. En el Table Editor de Supabase, abre las tablas `cliente` y `vehiculo`.
4. **Resultado esperado:** las filas nuevas aparecen ahí, con los datos exactos que escribiste. Recarga la página del sistema — el cliente y el vehículo siguen apareciendo (no era un dato de mentira en memoria).

### Prueba 3 — El total de una orden se calcula solo
1. Como `erodriguez` → **Órdenes de Servicio** → **+ Nueva Orden** → elige el vehículo del paso anterior y marca 2 servicios.
2. En Supabase, abre `orden_servicio` (busca la orden más reciente) y `detalle_servicio` filtrando por esa orden.
3. **Resultado esperado:** `orden_servicio.total` ya trae la suma de los dos precios — nadie lo escribió a mano, lo calculó el trigger `fn_actualizar_total_orden`.

### Prueba 4 — Un repuesto usado descuenta el stock solo
1. Como `jrodas` (Inventario) → **Repuestos** → anota el `stock_actual` de cualquier repuesto (ej. 12).
2. Inicia sesión como `narias` (Mecánico) → abre una de sus órdenes → **Ver detalle completo** → agrega ese mismo repuesto, cantidad 2.
3. Vuelve al Table Editor → tabla `repuesto` → busca ese repuesto.
4. **Resultado esperado:** el `stock_actual` ahora es 10 (bajó exactamente 2), y en `detalle_repuesto` aparece la fila nueva con esa cantidad y precio.

### Prueba 5 — Facturar y verlo en tiempo real
1. Deja la orden del paso 4 avanzar hasta "Finalizado" (botón "Marcar como Finalizado" en el panel del Mecánico).
2. Como `erodriguez` → **Facturación** → **+ Generar factura** → elige esa orden y un método de pago → confirma.
3. **Resultado esperado, dos cosas a la vez:**
   - En el Table Editor, la tabla `factura` tiene la fila nueva con el número de factura ya asignado (ej. `FAC-0004`) y la orden en `orden_servicio` ya quedó en estado "Entregado".
   - Si tenías la pantalla de Facturación abierta en OTRA pestaña o navegador con otro usuario con acceso, la factura nueva aparece sola en la lista, sin recargar — eso es Supabase Realtime funcionando.
