@AGENTS.md

# Taller Bonilla — Instrucciones del proyecto

Sistema de gestión web para "El Taller Bonilla", taller automotriz en Sonsonate, El Salvador. Reemplaza el manejo actual en papel/cuadernos.

Antes de escribir código nuevo, revisa `docs/contexto-proyecto.md` para entender el contexto completo del proyecto. Explica en español, en lenguaje simple, qué haces en cada paso importante — quien maneja este proyecto está aprendiendo desde cero. Si algo no está claro, pregunta antes de asumir.

## Diseño (obligatorio)
- Tema oscuro (dark mode) con acento "rojo sangre" (~#A31212), fondos #0D0D0F / #1C1C1F.
- Tailwind CSS + shadcn/ui como base, Framer Motion para animaciones (fade + slide escalonado al cargar, hover con brillo rojo).
- Nada genérico ni de plantilla gratuita. Tipografía sans-serif moderna, buena jerarquía visual.
- El diseño se está maquetando primero en Figma Make. Antes de construir una pantalla en código, revisa si ya existe su versión aprobada en Figma y replica fielmente esos estilos y componentes en vez de improvisar un estilo distinto.

## Responsividad (obligatorio)
- Debe verse y funcionar bien en celular, tablet y computadora.
- Configúralo como PWA (manifest.json + íconos) instalable desde Chrome en Android/iOS.

## Autenticación y roles (obligatorio)
- Login por **nombre de usuario** (no correo visible en la pantalla). Internamente, busca el correo asociado a ese usuario en la tabla `usuario` y autentica con Supabase Auth usando ese correo.
- Sin casilla de "Recordarme" — el sistema se usa en computadoras compartidas del taller, cada quien inicia sesión siempre de forma explícita.
- Al crear un usuario nuevo, exige contraseña segura (mínimo 8 caracteres, una mayúscula, un número, un carácter especial) con indicador visual de fortaleza en tiempo real.
- 5 roles: **Administrador**, **Supervisora**, **Secretario/a**, **Mecánico**, **Inventario**. Cada rol ve SOLO los módulos que le corresponden en la tabla de abajo — nada de acceso de solo lectura a módulos ajenos.

| Módulo | Administrador | Supervisora | Secretario/a | Mecánico | Inventario |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard propio | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clientes | ✅ | — | ✅ | — | — |
| Vehículos | ✅ | — | ✅ | — | — |
| Órdenes de servicio | ✅ (control total) | ✅ (supervisa/reasigna, no crea nuevas) | ✅ (crea la orden de entrada al recibir el vehículo) | ✅ (solo las suyas, actualiza estado) | — |
| Inventario / repuestos | ✅ | — | — | — | ✅ |
| Facturación | ✅ | — | ✅ | — | — |
| Empleados | ✅ | ✅ (solo ver) | — | — | — |
| Reportes | ✅ | ✅ | — | — | — |
| Usuarios / configuración | ✅ | — | — | — | — |

- El rol **Secretario/a** (Emely) es la puerta de entrada del taller: registra clientes y vehículos nuevos, crea la orden de servicio cuando el vehículo llega (con fecha de entrega estimada, y genera un comprobante de recepción para el cliente), y más adelante genera la factura cuando la orden está finalizada.
- Activa Row Level Security (RLS) en TODAS las tablas de Supabase antes de dar el proyecto por terminado, reflejando la tabla de arriba.
- Nunca expongas llaves secretas de Supabase en el código del frontend; usa variables de entorno.
- Valida todos los formularios antes de enviarlos a la base de datos.

## Tiempo real (obligatorio)
- Usa Supabase Realtime en las pantallas de: órdenes de servicio, inventario de repuestos y facturación.
- Cuando un usuario cambia algo en esas tablas, los demás usuarios conectados deben verlo reflejado sin recargar la página.

## Reportes
- Los reportes en PDF y Excel deben tener diseño cuidado: logo/nombre del taller, colores consistentes con el sistema, tablas bien formateadas — no texto plano sin estilo.

## Estabilidad
- Un fallo en una operación (ej. no se pudo guardar una factura) no debe romper toda la pantalla; muestra un mensaje claro al usuario y permite reintentar.
- Usa transacciones en operaciones que dependen entre sí (ej. descontar stock al mismo tiempo que se registra un repuesto usado).