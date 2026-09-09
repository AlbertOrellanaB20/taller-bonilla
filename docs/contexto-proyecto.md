# Contexto del proyecto — Sistema Gerencial Taller Bonilla

## Qué es
Proyecto final del Instituto Nacional de Acajutla, Módulo 3.8 — Proyecto Innovador de Desarrollo de Software, sección Tercero Desarrollo de Software. Sistema de información gerencial para "El Taller Bonilla", taller automotriz en Sonsonate, El Salvador, que actualmente lleva todo en papel/cuadernos.

## Problema que resuelve
- Pérdida de información por manejo en papel
- Errores en cálculos manuales
- Desorden en el inventario de repuestos
- Descontrol del historial de vehículos y servicios
- Lentitud para generar facturas y reportes

## Objetivo general
Sistema web (con soporte para instalarse como app en celular/tablet, PWA) que gestione clientes, vehículos, órdenes de servicio, inventario de repuestos, facturación y reportes de un taller mecánico, en tiempo real y con roles definidos.

## Equipo real y roles del sistema
| Rol | Persona | Función |
|---|---|---|
| Administrador | Alberto Orellana | Control total: usuarios, configuración, reportes generales |
| Supervisora | Nahomy Alexandra Guzmán | Supervisa órdenes de servicio, empleados y reportes |
| Secretario/a | Emely Lissbeth Rodríguez | Recibe clientes y vehículos, crea la orden de entrada, y genera la factura al finalizar el servicio |
| Mecánico | Noé Alexander Arias | Consulta y actualiza el estado de sus órdenes asignadas |
| Inventario | José Luis Rodas | Gestiona repuestos, proveedores y stock |

Nota: el rol "Cliente" también existe en la base de datos, pero es para los clientes del taller (dueños de vehículos), no para el equipo del proyecto.

La tabla completa de qué módulo puede ver o editar cada rol está en `CLAUDE.md`, en la raíz del proyecto — revísala antes de construir cualquier pantalla o política de RLS.

## Módulos del sistema
1. **Clientes**: registro, edición, historial de servicios (gestiona Secretario/a; Administrador con acceso total)
2. **Vehículos**: registro por cliente (placa, marca, modelo, año, color, kilometraje) (gestiona Secretario/a; Administrador con acceso total)
3. **Órdenes de servicio**: se crean al recibir el vehículo (Secretario/a), con fecha de entrega estimada. Estado (Pendiente, En Proceso, Finalizado, Entregado), servicios y repuestos usados, empleado asignado. El Mecánico actualiza el estado de las suyas; Supervisora supervisa y reasigna las existentes
4. **Inventario de repuestos**: stock actual/mínimo, alertas de bajo stock, proveedores (gestiona Inventario)
5. **Facturación**: estado de factura, método de pago, subtotal/IVA/total calculados automáticamente (gestiona Secretario/a)
6. **Reportes**: servicios más solicitados, ingresos por periodo, alertas de inventario bajo (Administrador y Supervisora)

## Modelo de datos
La base de datos ya está creada — ver `database/taller_bonilla_supabase.sql` en este repositorio (script completo con tablas, triggers y datos iniciales, pensado para pegarse directo en el SQL Editor de Supabase). Entidades principales: rol, usuario, empleado, cliente, vehiculo, orden_servicio, detalle_servicio, servicio, proveedor, repuesto, detalle_repuesto, factura, estado_orden, estado_factura, metodo_pago.

Reglas de negocio ya definidas en triggers dentro del script SQL:
- Al agregar un repuesto a una orden, se descuenta el stock automáticamente (y se restaura si se elimina)
- El total de la orden se recalcula automáticamente al agregar/quitar servicios o repuestos

## Diseño
El diseño visual (dark mode, acento rojo sangre, animaciones) se está maquetando primero en Figma Make, pantalla por pantalla, empezando por el login y los dashboards de cada rol. Antes de construir una pantalla en código, revisa si ya existe su versión aprobada en Figma y replica fielmente esos estilos y componentes.

## Requisitos no funcionales importantes
- Seguridad de acceso por usuario/contraseña (vía Supabase Auth)
- Sistema responsive: computadora, tablet y celular
- Instalable como PWA desde el navegador en Android
- Actualización en tiempo real entre roles (Supabase Realtime)
- Diseño moderno y cuidado, no genérico
- Reportes en PDF y Excel con buen diseño visual

## Stack tecnológico decidido
- Frontend/Backend: Next.js (React + TypeScript)
- Estilos: Tailwind CSS + shadcn/ui
- Animaciones: Framer Motion
- Base de datos y autenticación: Supabase (PostgreSQL + Supabase Auth + Realtime)
- Hosting: Vercel
- Control de versiones: Git + GitHub
- Diseño previo de pantallas: Figma Make