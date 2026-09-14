# Manual de Usuario — Sistema Taller Bonilla

Esta guía explica qué hace cada rol dentro del sistema y cómo usar cada pantalla. Está pensada para el equipo del taller, no hace falta ningún conocimiento técnico.

## Cómo entrar al sistema

1. Abre la dirección del sistema en tu navegador (computadora, tablet o celular).
2. Escribe tu **nombre de usuario** (no tu correo — el correo no aparece en ningún lado de la pantalla de inicio).
3. Escribe tu contraseña.
4. Presiona **Iniciar sesión**.

No existe casilla de "Recordarme": como las computadoras del taller las usa varias personas, cada quien debe iniciar sesión siempre de forma explícita y cerrarla al terminar (botón **Cerrar sesión**, arriba a la derecha, dentro del círculo con tus iniciales).

Si te equivocas de usuario o contraseña, el sistema te lo indica con un mensaje claro para que lo intentes de nuevo.

### Instalar el sistema como app (opcional)

Desde el celular, abre el sistema en Chrome y busca la opción **"Agregar a pantalla de inicio"** o **"Instalar app"** en el menú del navegador (los tres puntos). Queda como un ícono más, igual que cualquier otra aplicación.

---

## Administrador — Alberto Orellana

El Administrador tiene acceso a **todo el sistema**, sin excepción. Ve las mismas pantallas que los demás roles, pero con control total (puede crear, editar y eliminar en cualquier módulo).

- **Dashboard**: resumen general — ingresos del mes, órdenes activas, vehículos en el taller, alertas de stock bajo, ingresos de los últimos 7 días, servicios más pedidos, órdenes recientes.
- **Clientes / Vehículos**: igual que Secretario/a (ver más abajo) — puede registrar y consultar.
- **Órdenes de Servicio**: ve todas las órdenes, puede asignar o cambiar el mecánico responsable y cambiar el estado de cualquier orden.
- **Inventario**: igual que Inventario (ver más abajo) — puede ajustar stock y agregar repuestos.
- **Facturación**: igual que Secretario/a — puede generar, marcar como pagada o anular facturas.
- **Empleados**: lista de todo el personal (menos él mismo), con su rol, correo y estado.
- **Reportes**: los mismos reportes de Supervisora, exportables a PDF y Excel.
- **Usuarios** (exclusivo del Administrador): aquí se crean las cuentas de acceso del resto del equipo.
  - **Nuevo Usuario**: nombre completo, correo, nombre de usuario, contraseña (el sistema exige mínimo 8 caracteres, una mayúscula, un número y un carácter especial, y muestra qué tan fuerte es mientras la escribes), rol, y si el rol es Mecánico, su especialidad.
  - **Editar**: cambia cualquier dato de un usuario existente.
  - **Cambiar contraseña**: abre el mismo formulario para escribir una contraseña nueva para esa persona.
  - **Activar / Desactivar**: un usuario desactivado no puede iniciar sesión, pero su información no se borra.
- **Configuración**: pantalla reservada para más adelante (todavía no tiene contenido).

---

## Supervisora — Nahomy Guzmán

Supervisa el trabajo del taller, pero **no registra clientes ni crea órdenes nuevas** — eso lo hace Secretario/a.

- **Dashboard / Órdenes de Servicio**: tabla con todas las órdenes del taller. Para cada una puede:
  - Cambiar el **mecánico asignado** (selector "Sin asignar" o el nombre del mecánico).
  - Cambiar el **estado**: Pendiente → En Proceso → Finalizado → Entregado.
  - Ver de un vistazo cuáles órdenes están **retrasadas** (marcadas en rojo, con ⚠).
  - Ver la **carga de trabajo por mecánico** (cuántas órdenes activas tiene cada uno).
- **Empleados**: lista de solo lectura de todo el personal (mecánicos con su especialidad y cuántas órdenes activas tienen; el resto del equipo). No puede crear ni editar cuentas — eso es del Administrador.
- **Reportes**: tres reportes con gráficos:
  1. Servicios más solicitados del mes.
  2. Tiempo promedio de reparación por tipo de servicio.
  3. Desempeño por mecánico (órdenes completadas en el mes).

  Cada reporte tiene dos botones, **PDF** y **XLSX**, que descargan el reporte ya formateado con los colores y el nombre del taller, listo para imprimir o compartir.

---

## Secretario/a — Emely Rodríguez

Es la puerta de entrada del taller: recibe a los clientes y sus vehículos, y más adelante genera la factura.

- **Dashboard**: ingresos de hoy, facturas pendientes, vehículos recibidos hoy, órdenes listas para facturar, ingresos de la semana.
- **Clientes**: botón **+ Nuevo Cliente** — nombre, teléfono, dirección y DUI. La tabla muestra cuántos vehículos tiene registrados cada cliente.
- **Vehículos**: botón **+ Nuevo Vehículo** — placa, marca, modelo, año, color, kilometraje, y el cliente dueño (puede elegir uno existente o crear uno nuevo ahí mismo, sin salir del formulario).
- **Órdenes de Servicio**: aquí se registra la llegada de un vehículo al taller.
  1. Botón **+ Nueva Orden**.
  2. Elige el vehículo (o regístralo ahí mismo, junto con su cliente, si es nuevo).
  3. Marca los servicios que el cliente pidió (checklist).
  4. Define la **fecha estimada de entrega**.
  5. Al guardar, el sistema genera automáticamente un **comprobante de recepción** listo para imprimir y entregarle al cliente.
- **Facturación**: cuando una orden queda **Finalizada** (el Mecánico y la Supervisora se encargan de eso), aparece en la lista de "órdenes listas para facturar".
  1. Botón **+ Generar factura** (o el botón directo junto a la orden en el Dashboard).
  2. Elige la orden y el método de pago (Efectivo, Tarjeta o Transferencia).
  3. El sistema calcula el IVA (13%) y el total automáticamente, y asigna el número de factura.
  4. Desde la tabla de facturas puede **marcar como pagada** o **anular** cualquier factura, y ver el detalle de cada una (con opción de imprimir).

---

## Mecánico — Noé Arias

Solo ve **las órdenes que tiene asignadas**, nunca las de otro mecánico ni el resto del sistema.

- **Dashboard**: cuántas órdenes tiene asignadas hoy, cuántas en proceso, cuántas finalizadas, y sus tarjetas de trabajo activo.
- **Mis Órdenes**: todas sus órdenes, con pestañas para filtrar por estado (Todas / Pendiente / En Proceso / Finalizado).
  - Cada orden es una tarjeta con los datos del vehículo, el cliente, los servicios pedidos y las fechas.
  - Botón para **avanzar el estado** (Iniciar trabajo → Marcar como Finalizado).
  - Botón **Ver detalle completo**, donde puede:
    - Marcar cada **servicio** como completado (checklist, uno por uno).
    - **Agregar repuestos** usados de un catálogo real (elige el repuesto y la cantidad) — esto descuenta el stock automáticamente y el sistema le avisa si ya no hay suficiente.
    - **Finalizar** la orden cuando termina todo el trabajo.

---

## Inventario — José Luis Rodas

Controla los repuestos y los proveedores del taller.

- **Dashboard**: total de repuestos, cuántos están en stock bajo o crítico, valor total del inventario, proveedores activos, y los repuestos más usados en el mes.
- **Repuestos**: tabla completa con código, nombre, proveedor, stock actual, stock mínimo, precio y estado (OK / Stock bajo / Crítico).
  - Botón **+ Nuevo Repuesto**: código, nombre, proveedor, stock inicial, stock mínimo y precio.
  - Botón **Ajustar stock** en cada repuesto: registra una **entrada** (compra o recepción) o una **salida** (uso o merma), con motivo. El stock se actualiza al instante para todo el que esté viendo la pantalla en ese momento (incluyendo cuando un Mecánico usa un repuesto en una orden).
- **Proveedores**: tabla con nombre, teléfono y cuántos repuestos suministra cada uno. Botón **+ Nuevo Proveedor** para agregar uno.

---

## Cosas que pasan solas (no hay que hacer nada)

- Cuando alguien cambia algo en **órdenes, inventario o facturación**, todos los que tengan esa pantalla abierta lo ven reflejado al instante, sin recargar la página.
- El total de una orden se recalcula solo cada vez que se agrega o quita un servicio o un repuesto.
- El stock de un repuesto baja solo cuando un Mecánico lo usa en una orden, y sube solo si ese uso se elimina.
- Si algo falla al guardar (por ejemplo, se cae el internet un segundo), el sistema muestra un mensaje de error claro y deja el formulario abierto para volver a intentarlo — no hay que empezar de cero ni se rompe la pantalla.
