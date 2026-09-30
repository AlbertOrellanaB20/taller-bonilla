-- =====================================================================
-- Taller Bonilla — RLS (Row Level Security) completo y corregido
-- Pegar TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Es seguro correrlo varias veces (usa DROP POLICY IF EXISTS antes de
-- cada CREATE POLICY, y CREATE OR REPLACE FUNCTION), así que si algún
-- día reconstruyes el proyecto desde cero, solo vuelve a pegar esto
-- después de correr database/taller_bonilla_supabase.sql.
-- =====================================================================

-- =====================================================================
-- 0. ARREGLO URGENTE — esto es lo que rompía la demo con el profesor.
--
-- fn_rol_actual() y fn_empleado_actual() son funciones que usan CASI
-- TODAS las políticas de abajo para saber "¿qué rol tiene este usuario?"
-- y "¿qué mecánico es?". El problema: esas funciones leen de la tabla
-- `usuario`, y esa tabla TAMBIÉN tiene políticas de RLS que llaman a
-- fn_rol_actual() — es decir, para saber tu rol, Postgres necesitaba
-- saber tu rol, para lo cual necesitaba saber tu rol... un ciclo sin fin
-- que Postgres corta con el error "stack depth limit exceeded". Por eso
-- cualquier pantalla que hiciera una consulta un poco más real (no solo
-- leer tu propia fila) fallaba con un error de servidor, para cualquier
-- rol.
--
-- La corrección: marcar estas dos funciones como SECURITY DEFINER. Así,
-- cuando la función necesita mirar la tabla `usuario` o `empleado` por
-- dentro, lo hace saltándose las políticas de RLS de esas tablas (no hay
-- ciclo), y sigue devolviendo solo el rol/empleado del usuario que hizo
-- la consulta (auth.uid()) — no expone nada de otros usuarios.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_rol_actual()
RETURNS TEXT AS $$
    SELECT r.nombre_rol FROM usuario u
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE u.auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_empleado_actual()
RETURNS INT AS $$
    SELECT e.id_empleado FROM empleado e
    JOIN usuario u ON u.id_usuario = e.id_usuario
    WHERE u.auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- =====================================================================
-- 1. Permisos base (por si esto se corre en un proyecto nuevo de cero)
-- =====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =====================================================================
-- 2. Catálogos de solo lectura para cualquier usuario autenticado
--    (rol, estado_orden, estado_factura, metodo_pago, servicio)
-- =====================================================================
ALTER TABLE rol ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rol_lectura_autenticados" ON rol;
CREATE POLICY "rol_lectura_autenticados" ON rol FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE estado_orden ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estado_orden_lectura_autenticados" ON estado_orden;
CREATE POLICY "estado_orden_lectura_autenticados" ON estado_orden FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE estado_factura ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estado_factura_lectura_autenticados" ON estado_factura;
CREATE POLICY "estado_factura_lectura_autenticados" ON estado_factura FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE metodo_pago ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "metodo_pago_lectura_autenticados" ON metodo_pago;
CREATE POLICY "metodo_pago_lectura_autenticados" ON metodo_pago FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicio_lectura_autenticados" ON servicio;
CREATE POLICY "servicio_lectura_autenticados" ON servicio FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================================
-- 3. usuario — cada quien lee su propia fila; Administrador control
--    total; Supervisora puede leer a todos (para la pantalla Empleados).
-- =====================================================================
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario_lee_su_propia_fila" ON usuario;
CREATE POLICY "usuario_lee_su_propia_fila" ON usuario
FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "usuario_admin_control_total" ON usuario;
CREATE POLICY "usuario_admin_control_total" ON usuario
FOR ALL USING (fn_rol_actual() = 'Administrador') WITH CHECK (fn_rol_actual() = 'Administrador');

DROP POLICY IF EXISTS "usuario_lectura_supervisora" ON usuario;
CREATE POLICY "usuario_lectura_supervisora" ON usuario
FOR SELECT USING (fn_rol_actual() = 'Supervisora');

-- =====================================================================
-- 4. empleado — Administrador control total; Supervisora lectura;
--    cada empleado lee su propia fila (la usa fn_empleado_actual()).
-- =====================================================================
ALTER TABLE empleado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empleado_admin_control_total" ON empleado;
CREATE POLICY "empleado_admin_control_total" ON empleado
FOR ALL USING (fn_rol_actual() = 'Administrador') WITH CHECK (fn_rol_actual() = 'Administrador');

DROP POLICY IF EXISTS "empleado_supervisora_lectura" ON empleado;
CREATE POLICY "empleado_supervisora_lectura" ON empleado
FOR SELECT USING (fn_rol_actual() = 'Supervisora');

DROP POLICY IF EXISTS "empleado_lee_su_propia_fila" ON empleado;
CREATE POLICY "empleado_lee_su_propia_fila" ON empleado
FOR SELECT USING (id_usuario = (SELECT id_usuario FROM usuario WHERE auth_user_id = auth.uid()));

-- =====================================================================
-- 5. cliente y vehiculo — control total de Administrador y Secretario/a;
--    lectura para Supervisora (todo) y Mecánico (solo lo relacionado a
--    SUS órdenes asignadas — así puede ver el nombre/teléfono del
--    cliente y los datos del vehículo en su panel, sin poder navegar
--    la lista completa de clientes).
-- =====================================================================
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_admin_secretaria_control_total" ON cliente;
CREATE POLICY "cliente_admin_secretaria_control_total" ON cliente
FOR ALL USING (fn_rol_actual() IN ('Administrador', 'Secretario/a')) WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "cliente_lectura_relacionada" ON cliente;
CREATE POLICY "cliente_lectura_relacionada" ON cliente
FOR SELECT USING (
    fn_rol_actual() = 'Supervisora'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM vehiculo v JOIN orden_servicio os ON os.id_vehiculo = v.id_vehiculo
        WHERE v.id_cliente = cliente.id_cliente AND os.id_empleado = fn_empleado_actual()
    ))
);

ALTER TABLE vehiculo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehiculo_admin_secretaria_control_total" ON vehiculo;
CREATE POLICY "vehiculo_admin_secretaria_control_total" ON vehiculo
FOR ALL USING (fn_rol_actual() IN ('Administrador', 'Secretario/a')) WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "vehiculo_lectura_relacionada" ON vehiculo;
CREATE POLICY "vehiculo_lectura_relacionada" ON vehiculo
FOR SELECT USING (
    fn_rol_actual() = 'Supervisora'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_vehiculo = vehiculo.id_vehiculo AND os.id_empleado = fn_empleado_actual()
    ))
);

-- =====================================================================
-- 6. orden_servicio — Administrador control total; Supervisora ve todo
--    y reasigna/cambia estado (no crea); Secretario/a crea y ve todo;
--    Mecánico ve y actualiza SOLO sus propias órdenes asignadas.
-- =====================================================================
ALTER TABLE orden_servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orden_servicio_lectura" ON orden_servicio;
CREATE POLICY "orden_servicio_lectura" ON orden_servicio
FOR SELECT USING (
    fn_rol_actual() IN ('Administrador', 'Supervisora', 'Secretario/a')
    OR (fn_rol_actual() = 'Mecánico' AND id_empleado = fn_empleado_actual())
);

DROP POLICY IF EXISTS "orden_servicio_creacion" ON orden_servicio;
CREATE POLICY "orden_servicio_creacion" ON orden_servicio
FOR INSERT WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "orden_servicio_actualizacion" ON orden_servicio;
CREATE POLICY "orden_servicio_actualizacion" ON orden_servicio
FOR UPDATE USING (
    fn_rol_actual() IN ('Administrador', 'Supervisora', 'Secretario/a')
    OR (fn_rol_actual() = 'Mecánico' AND id_empleado = fn_empleado_actual())
) WITH CHECK (
    fn_rol_actual() IN ('Administrador', 'Supervisora', 'Secretario/a')
    OR (fn_rol_actual() = 'Mecánico' AND id_empleado = fn_empleado_actual())
);

-- =====================================================================
-- 7. detalle_servicio — servicios dentro de una orden. Se crea junto
--    con la orden (Secretario/a); el Mecánico marca sus checkboxes de
--    "completado" solo en sus propias órdenes.
-- =====================================================================
ALTER TABLE detalle_servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detalle_servicio_lectura" ON detalle_servicio;
CREATE POLICY "detalle_servicio_lectura" ON detalle_servicio
FOR SELECT USING (
    fn_rol_actual() IN ('Administrador', 'Secretario/a', 'Supervisora')
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_servicio.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
);

DROP POLICY IF EXISTS "detalle_servicio_creacion" ON detalle_servicio;
CREATE POLICY "detalle_servicio_creacion" ON detalle_servicio
FOR INSERT WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "detalle_servicio_borra" ON detalle_servicio;
CREATE POLICY "detalle_servicio_borra" ON detalle_servicio
FOR DELETE USING (fn_rol_actual() = 'Administrador');

DROP POLICY IF EXISTS "detalle_servicio_mecanico_marca_completado" ON detalle_servicio;
CREATE POLICY "detalle_servicio_mecanico_marca_completado" ON detalle_servicio
FOR UPDATE USING (
    fn_rol_actual() = 'Administrador'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_servicio.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
) WITH CHECK (
    fn_rol_actual() = 'Administrador'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_servicio.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
);

-- =====================================================================
-- 8. proveedor y repuesto — control total de Administrador e Inventario.
--    El Mecánico solo necesita LEER el catálogo de repuestos para
--    agregarlos a una orden (no puede crear/editar repuestos ni ver
--    proveedores).
-- =====================================================================
ALTER TABLE proveedor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proveedor_admin_inventario_control_total" ON proveedor;
CREATE POLICY "proveedor_admin_inventario_control_total" ON proveedor
FOR ALL USING (fn_rol_actual() IN ('Administrador', 'Inventario')) WITH CHECK (fn_rol_actual() IN ('Administrador', 'Inventario'));

ALTER TABLE repuesto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repuesto_admin_inventario_control_total" ON repuesto;
CREATE POLICY "repuesto_admin_inventario_control_total" ON repuesto
FOR ALL USING (fn_rol_actual() IN ('Administrador', 'Inventario')) WITH CHECK (fn_rol_actual() IN ('Administrador', 'Inventario'));

DROP POLICY IF EXISTS "repuesto_lectura_mecanico" ON repuesto;
CREATE POLICY "repuesto_lectura_mecanico" ON repuesto
FOR SELECT USING (fn_rol_actual() = 'Mecánico');

-- =====================================================================
-- 9. detalle_repuesto — repuestos usados en una orden. El Mecánico los
--    agrega/quita solo en sus propias órdenes (esto dispara el trigger
--    que descuenta stock — ver database/taller_bonilla_supabase.sql).
-- =====================================================================
ALTER TABLE detalle_repuesto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detalle_repuesto_lectura" ON detalle_repuesto;
CREATE POLICY "detalle_repuesto_lectura" ON detalle_repuesto
FOR SELECT USING (
    fn_rol_actual() IN ('Administrador', 'Supervisora', 'Secretario/a', 'Inventario')
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_repuesto.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
);

DROP POLICY IF EXISTS "detalle_repuesto_escribe" ON detalle_repuesto;
CREATE POLICY "detalle_repuesto_escribe" ON detalle_repuesto
FOR INSERT WITH CHECK (
    fn_rol_actual() = 'Administrador'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_repuesto.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
);

DROP POLICY IF EXISTS "detalle_repuesto_borra" ON detalle_repuesto;
CREATE POLICY "detalle_repuesto_borra" ON detalle_repuesto
FOR DELETE USING (
    fn_rol_actual() = 'Administrador'
    OR (fn_rol_actual() = 'Mecánico' AND EXISTS (
        SELECT 1 FROM orden_servicio os WHERE os.id_orden_servicio = detalle_repuesto.id_orden_servicio AND os.id_empleado = fn_empleado_actual()
    ))
);

-- =====================================================================
-- 10. factura — Administrador y Secretario/a la ven, crean y actualizan
--     (marcar pagada / anular). Nadie más tiene acceso.
-- =====================================================================
ALTER TABLE factura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_admin_secretaria" ON factura;
DROP POLICY IF EXISTS "facturas_admin_secretaria_lectura" ON factura;
CREATE POLICY "facturas_admin_secretaria_lectura" ON factura
FOR SELECT USING (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "facturas_admin_secretaria_creacion" ON factura;
CREATE POLICY "facturas_admin_secretaria_creacion" ON factura
FOR INSERT WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

DROP POLICY IF EXISTS "facturas_admin_secretaria_actualizacion" ON factura;
CREATE POLICY "facturas_admin_secretaria_actualizacion" ON factura
FOR UPDATE USING (fn_rol_actual() IN ('Administrador', 'Secretario/a')) WITH CHECK (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

-- =====================================================================
-- 11. fn_repuestos_mas_usados_mes — Inventario NO tiene permiso de leer
--     orden_servicio (esa tabla es de otro módulo, ver política 6), pero
--     el widget "Más utilizados este mes" de su Dashboard necesita cruzar
--     detalle_repuesto con la fecha de la orden para saber qué se usó
--     "este mes". Sin esta función, ese cruce se hacía con un JOIN normal
--     desde el navegador y RLS bloqueaba silenciosamente el lado de
--     orden_servicio (lo devolvía como null), así que el widget SIEMPRE
--     salía vacío para Inventario, sin importar cuántos repuestos se
--     usaran. La solución: una función SECURITY DEFINER que hace el
--     cruce por dentro (saltándose RLS) pero solo devuelve nombre +
--     cantidad usada — nunca datos de la orden, del cliente ni del
--     mecánico — así que no se rompe el aislamiento entre módulos.
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_repuestos_mas_usados_mes()
RETURNS TABLE(nombre TEXT, usado BIGINT) AS $$
    SELECT r.nombre, SUM(dr.cantidad)::BIGINT AS usado
    FROM detalle_repuesto dr
    JOIN repuesto r ON r.id_repuesto = dr.id_repuesto
    JOIN orden_servicio os ON os.id_orden_servicio = dr.id_orden_servicio
    WHERE os.fecha_ingreso >= date_trunc('month', now())
      AND fn_rol_actual() IN ('Administrador', 'Inventario')
    GROUP BY r.nombre
    ORDER BY usado DESC
    LIMIT 7
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION fn_repuestos_mas_usados_mes() TO authenticated;

-- =====================================================================
-- 12. fn_mecanico_nombre_por_orden / fn_repuestos_de_ordenes — el mismo
--     problema de la política 11, pero en Facturación: Secretario/a no
--     tiene permiso de leer `empleado` (política 4) ni `repuesto`
--     (política 8), así que al listar facturas el mecánico salía SIEMPRE
--     "Sin asignar" (aunque sí tuviera uno asignado) y los repuestos
--     usados desaparecían de la factura — el subtotal mostrado no
--     cuadraba con la suma de las líneas visibles, exactamente el bug
--     reportado. Reproducido en vivo firmando como erodriguez antes de
--     este arreglo: la orden_servicio.empleado y detalle_repuesto.repuesto
--     embebidos llegaban en null pese a existir los datos.
--     Estas dos funciones resuelven ambos cruces por dentro (SECURITY
--     DEFINER) y solo devuelven el nombre / la línea de repuesto ya
--     resuelta — nunca la tabla completa de empleado ni de repuesto — así
--     que el aislamiento entre módulos que pide CLAUDE.md se mantiene.
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_mecanico_nombre_por_orden(p_ids INT[])
RETURNS TABLE(id_orden_servicio INT, mecanico_nombre TEXT) AS $$
    SELECT os.id_orden_servicio, u.nombre_completo
    FROM orden_servicio os
    JOIN empleado e ON e.id_empleado = os.id_empleado
    JOIN usuario u ON u.id_usuario = e.id_usuario
    WHERE os.id_orden_servicio = ANY(p_ids)
      AND fn_rol_actual() IN ('Administrador', 'Supervisora', 'Secretario/a')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION fn_mecanico_nombre_por_orden(INT[]) TO authenticated;

CREATE OR REPLACE FUNCTION fn_repuestos_de_ordenes(p_ids INT[])
RETURNS TABLE(id_orden_servicio INT, nombre TEXT, cantidad INT, precio_unitario NUMERIC, subtotal NUMERIC) AS $$
    SELECT dr.id_orden_servicio, r.nombre, dr.cantidad, dr.precio_unitario_aplicado, dr.subtotal
    FROM detalle_repuesto dr
    JOIN repuesto r ON r.id_repuesto = dr.id_repuesto
    WHERE dr.id_orden_servicio = ANY(p_ids)
      AND fn_rol_actual() IN ('Administrador', 'Secretario/a')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION fn_repuestos_de_ordenes(INT[]) TO authenticated;
