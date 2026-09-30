-- =====================================================================
-- Sistema de Gestión Taller Bonilla — versión PostgreSQL para Supabase
-- Convertido desde MySQL. Pegar en Supabase > SQL Editor > New query
-- Actualizado: catálogo de roles con los 5 roles finales del proyecto
-- =====================================================================

-- 1. TABLAS DE USUARIOS Y PERSONAS
CREATE TABLE rol (
    id_rol      SERIAL PRIMARY KEY,
    nombre_rol  VARCHAR(30) NOT NULL UNIQUE
);

-- IMPORTANTE: la autenticación (login/contraseña) la maneja Supabase Auth,
-- no guardamos contraseña aquí. Enlazamos con auth.users mediante auth_user_id.
CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    id_rol           INT NOT NULL REFERENCES rol(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    auth_user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo  VARCHAR(100) NOT NULL,
    correo           VARCHAR(100) UNIQUE,
    nombre_usuario   VARCHAR(50) NOT NULL UNIQUE,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMP DEFAULT now()
);

CREATE TABLE empleado (
    id_empleado      SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    codigo_empleado  VARCHAR(20) NOT NULL UNIQUE,
    especialidad     VARCHAR(100)
);

CREATE TABLE cliente (
    id_cliente       SERIAL PRIMARY KEY,
    id_usuario       INT UNIQUE REFERENCES usuario(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    nombre_completo  VARCHAR(100) NOT NULL,
    telefono         VARCHAR(15) NOT NULL,
    direccion        VARCHAR(150),
    dui              VARCHAR(10),
    fecha_registro   TIMESTAMP DEFAULT now()
);

-- 2. VEHÍCULOS Y ÓRDENES DE SERVICIO
CREATE TABLE vehiculo (
    id_vehiculo   SERIAL PRIMARY KEY,
    id_cliente    INT NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE,
    placa         VARCHAR(10) NOT NULL UNIQUE,
    marca         VARCHAR(50) NOT NULL,
    modelo        VARCHAR(50) NOT NULL,
    anio          SMALLINT NOT NULL,
    color         VARCHAR(30),
    kilometraje   INT
);

CREATE TABLE estado_orden (
    id_estado_orden  SERIAL PRIMARY KEY,
    nombre_estado    VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE servicio (
    id_servicio      SERIAL PRIMARY KEY,
    nombre_servicio  VARCHAR(100) NOT NULL UNIQUE,
    precio_base      DECIMAL(10,2) NOT NULL
);

CREATE TABLE orden_servicio (
    id_orden_servicio       SERIAL PRIMARY KEY,
    id_vehiculo             INT NOT NULL REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE ON UPDATE CASCADE,
    id_empleado             INT REFERENCES empleado(id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
    id_estado_orden         INT NOT NULL REFERENCES estado_orden(id_estado_orden) ON DELETE RESTRICT ON UPDATE CASCADE,
    fecha_ingreso            TIMESTAMP NOT NULL DEFAULT now(),
    fecha_entrega_estimada   DATE,
    fecha_entrega_real       TIMESTAMP,
    total                    DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE detalle_servicio (
    id_detalle_servicio  SERIAL PRIMARY KEY,
    id_orden_servicio    INT NOT NULL REFERENCES orden_servicio(id_orden_servicio) ON DELETE CASCADE ON UPDATE CASCADE,
    id_servicio          INT NOT NULL REFERENCES servicio(id_servicio) ON DELETE RESTRICT ON UPDATE CASCADE,
    precio_aplicado      DECIMAL(10,2) NOT NULL
);

-- 3. REPUESTOS E INVENTARIO
CREATE TABLE proveedor (
    id_proveedor  SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    telefono      VARCHAR(15)
);

CREATE TABLE repuesto (
    id_repuesto      SERIAL PRIMARY KEY,
    id_proveedor     INT REFERENCES proveedor(id_proveedor) ON DELETE SET NULL ON UPDATE CASCADE,
    codigo           VARCHAR(20) NOT NULL UNIQUE,
    nombre           VARCHAR(100) NOT NULL,
    stock_actual     INT NOT NULL DEFAULT 0,
    stock_minimo     INT NOT NULL DEFAULT 0,
    precio_unitario  DECIMAL(10,2) NOT NULL
);

CREATE TABLE detalle_repuesto (
    id_detalle_repuesto        SERIAL PRIMARY KEY,
    id_orden_servicio          INT NOT NULL REFERENCES orden_servicio(id_orden_servicio) ON DELETE CASCADE ON UPDATE CASCADE,
    id_repuesto                INT NOT NULL REFERENCES repuesto(id_repuesto) ON DELETE RESTRICT ON UPDATE CASCADE,
    cantidad                   INT NOT NULL,
    precio_unitario_aplicado   DECIMAL(10,2) NOT NULL,
    subtotal                   DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario_aplicado) STORED
);

-- 4. FACTURACIÓN
CREATE TABLE estado_factura (
    id_estado_factura  SERIAL PRIMARY KEY,
    nombre_estado      VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE metodo_pago (
    id_metodo_pago  SERIAL PRIMARY KEY,
    nombre_metodo   VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE factura (
    id_factura          SERIAL PRIMARY KEY,
    id_orden_servicio   INT NOT NULL UNIQUE REFERENCES orden_servicio(id_orden_servicio) ON DELETE CASCADE ON UPDATE CASCADE,
    id_estado_factura   INT NOT NULL REFERENCES estado_factura(id_estado_factura) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_metodo_pago      INT NOT NULL REFERENCES metodo_pago(id_metodo_pago) ON DELETE RESTRICT ON UPDATE CASCADE,
    numero_factura      VARCHAR(20) NOT NULL UNIQUE,
    fecha_emision       TIMESTAMP DEFAULT now(),
    subtotal            DECIMAL(10,2) NOT NULL,
    iva                 DECIMAL(10,2) NOT NULL DEFAULT 0,
    total                DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + iva) STORED
);

-- 5. ÍNDICES
CREATE INDEX idx_orden_estado ON orden_servicio(id_estado_orden);
CREATE INDEX idx_orden_vehiculo ON orden_servicio(id_vehiculo);
CREATE INDEX idx_vehiculo_cliente ON vehiculo(id_cliente);
CREATE INDEX idx_repuesto_proveedor ON repuesto(id_proveedor);

-- 6. DATOS INICIALES (catálogos)
-- Roles finales del proyecto: Administrador (Alberto), Supervisora (Nahomy),
-- Secretario/a (Emely, recepción + facturación), Mecánico (Noé), Inventario (José Luis)
INSERT INTO rol (nombre_rol) VALUES ('Administrador'), ('Supervisora'), ('Secretario/a'), ('Mecánico'), ('Inventario');

INSERT INTO estado_orden (nombre_estado) VALUES ('Pendiente'), ('En Proceso'), ('Finalizado'), ('Entregado');

INSERT INTO estado_factura (nombre_estado) VALUES ('Pagada'), ('Pendiente'), ('Anulada');

INSERT INTO metodo_pago (nombre_metodo) VALUES ('Efectivo'), ('Tarjeta'), ('Transferencia');

INSERT INTO servicio (nombre_servicio, precio_base) VALUES
('Mecánica general', 25.00),
('Cambio de aceite', 15.00),
('Frenos', 30.00),
('Suspensión y dirección', 40.00),
('Sistema eléctrico e inyección electrónica', 35.00),
('Enderezado y pintura', 80.00),
('Rectificación de discos', 20.00);

-- 7. TRIGGERS (sintaxis PostgreSQL: función + trigger separados)
CREATE OR REPLACE FUNCTION fn_actualizar_total_orden(p_id_orden INT)
RETURNS void AS $$
BEGIN
    UPDATE orden_servicio
       SET total = (SELECT COALESCE(SUM(precio_aplicado), 0) FROM detalle_servicio WHERE id_orden_servicio = p_id_orden)
                  + (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_repuesto WHERE id_orden_servicio = p_id_orden)
     WHERE id_orden_servicio = p_id_orden;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_detalle_repuesto_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repuesto SET stock_actual = stock_actual - NEW.cantidad WHERE id_repuesto = NEW.id_repuesto;
    PERFORM fn_actualizar_total_orden(NEW.id_orden_servicio);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_repuesto_after_insert
AFTER INSERT ON detalle_repuesto
FOR EACH ROW EXECUTE FUNCTION trg_detalle_repuesto_insert();

CREATE OR REPLACE FUNCTION trg_detalle_repuesto_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repuesto SET stock_actual = stock_actual + OLD.cantidad WHERE id_repuesto = OLD.id_repuesto;
    PERFORM fn_actualizar_total_orden(OLD.id_orden_servicio);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_repuesto_after_delete
AFTER DELETE ON detalle_repuesto
FOR EACH ROW EXECUTE FUNCTION trg_detalle_repuesto_delete();

CREATE OR REPLACE FUNCTION trg_detalle_servicio_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM fn_actualizar_total_orden(OLD.id_orden_servicio);
        RETURN OLD;
    ELSE
        PERFORM fn_actualizar_total_orden(NEW.id_orden_servicio);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_servicio_after_insert
AFTER INSERT ON detalle_servicio
FOR EACH ROW EXECUTE FUNCTION trg_detalle_servicio_change();

CREATE TRIGGER trg_detalle_servicio_after_delete
AFTER DELETE ON detalle_servicio
FOR EACH ROW EXECUTE FUNCTION trg_detalle_servicio_change();

-- 8. SEGURIDAD A NIVEL DE FILA (RLS) — ejemplo base, se debe extender por tabla
-- siguiendo la tabla de permisos por módulo/rol documentada en CLAUDE.md

-- 8.0 PERMISOS BASE (GRANTs) — sin esto, NINGUNA tabla se puede leer ni desde
-- el frontend (anon/authenticated) ni desde el servidor (service_role), sin
-- importar si tiene RLS o no: Postgres exige el GRANT de tabla ANTES de que
-- las políticas de RLS entren en juego. Si al probar el login o cualquier
-- consulta ves el error "permission denied for table ..." con un hint que
-- dice "GRANT SELECT ON public.<tabla> TO ...", es porque falta correr esto.
-- Es el permiso base que Supabase normalmente deja configurado de fábrica;
-- si tu proyecto no lo trae, corre esto una sola vez:
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura ENABLE ROW LEVEL SECURITY;

-- 8.0.1 Catálogos de solo lectura (rol, estado_orden, estado_factura,
-- metodo_pago, servicio): Supabase activa RLS por defecto en las tablas
-- nuevas aunque este script no lo pida explícitamente. Sin una política,
-- eso las deja invisibles para anon/authenticated (solo service_role las ve,
-- porque ese rol se salta RLS) — y el login necesita leer `rol` para saber
-- qué rol tiene cada usuario. Como son solo catálogos de nombres (no hay
-- nada sensible), se abren de lectura para cualquier usuario autenticado.
ALTER TABLE rol ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rol_lectura_autenticados" ON rol
FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE estado_orden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estado_orden_lectura_autenticados" ON estado_orden
FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE estado_factura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estado_factura_lectura_autenticados" ON estado_factura
FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE metodo_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metodo_pago_lectura_autenticados" ON metodo_pago
FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "servicio_lectura_autenticados" ON servicio
FOR SELECT USING (auth.role() = 'authenticated');

-- Función helper: obtiene el rol del usuario autenticado actual.
-- SECURITY DEFINER es obligatorio aquí: esta función lee de `usuario`,
-- y `usuario` tiene sus propias políticas de RLS que llaman a esta misma
-- función (más abajo, en database/rls_politicas.sql) — sin SECURITY
-- DEFINER, evaluar una política dispara la otra en un ciclo infinito
-- ("stack depth limit exceeded" en cualquier consulta un poco más real
-- que leer tu propia fila). Con SECURITY DEFINER, esta función se salta
-- el RLS de `usuario` solo para su propia lectura interna, sin exponer
-- nada de otros usuarios (sigue filtrando por auth.uid()).
CREATE OR REPLACE FUNCTION fn_rol_actual()
RETURNS TEXT AS $$
    SELECT r.nombre_rol FROM usuario u
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE u.auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Las políticas de RLS de usuario/empleado/cliente/vehiculo/orden_servicio/
-- detalle_servicio/proveedor/repuesto/detalle_repuesto/factura viven en
-- database/rls_politicas.sql (un solo archivo, para no mantener las
-- políticas duplicadas en dos lugares que se puedan desincronizar).
-- Corre ese archivo completo justo después de este.

-- 9. REALTIME: habilitar para que los cambios se reflejen en vivo en el frontend
ALTER PUBLICATION supabase_realtime ADD TABLE orden_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_repuesto;
ALTER PUBLICATION supabase_realtime ADD TABLE factura;
ALTER PUBLICATION supabase_realtime ADD TABLE repuesto;

-- =====================================================================
-- 10. INTEGRACIÓN COMPLETA — cada módulo conectado a datos reales
-- Pegar esta sección completa en el SQL Editor de Supabase. Es segura de
-- correr sobre una base que ya tiene las secciones 1-9 de este script.
-- =====================================================================

-- 10.1 Columna nueva: checklist de servicios por el Mecánico (el diseño de
-- Figma ya la usa — "servicesDone" — pero la tabla original no la tenía).
ALTER TABLE detalle_servicio ADD COLUMN IF NOT EXISTS completado BOOLEAN NOT NULL DEFAULT FALSE;

-- 10.1.1 Columna nueva: permite desactivar un proveedor sin borrarlo (lo
-- usa Inventario). Un proveedor inactivo no debe aparecer al registrar
-- un repuesto nuevo — eso lo filtra la app, no la base de datos.
ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- 10.1.2 Columna nueva: correo del cliente, necesaria para poder enviarle la
-- factura por correo (botón "Enviar por correo" en Facturación). Es opcional
-- porque muchos clientes ya registrados en papel no tenían correo.
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS correo VARCHAR(150);

-- 10.2 Numeración automática de facturas (FAC-0001, FAC-0002, ...). Con esto
-- el número de factura ya no se calcula en el frontend: Postgres lo asigna
-- solo, de forma segura aunque dos personas facturen al mismo tiempo.
CREATE SEQUENCE IF NOT EXISTS factura_numero_seq START 1;
ALTER TABLE factura ALTER COLUMN numero_factura SET DEFAULT ('FAC-' || lpad(nextval('factura_numero_seq')::text, 4, '0'));

-- 10.3 Función helper: id_empleado del usuario autenticado actual (o NULL si
-- no es empleado). La usan las políticas de RLS de database/rls_politicas.sql
-- para que un Mecánico solo pueda ver/tocar SUS propias órdenes asignadas.
-- SECURITY DEFINER por la misma razón que fn_rol_actual() (sección 8):
-- sin esto, cae en el mismo ciclo infinito de RLS al leer `empleado`/`usuario`.
CREATE OR REPLACE FUNCTION fn_empleado_actual()
RETURNS INT AS $$
    SELECT e.id_empleado FROM empleado e
    JOIN usuario u ON u.id_usuario = e.id_usuario
    WHERE u.auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 10.4 Las funciones que descuentan stock y recalculan el total de la orden
-- se marcan SECURITY DEFINER: así, cuando un Mecánico agrega un repuesto a
-- SU orden, el trigger puede actualizar `repuesto.stock_actual` y
-- `orden_servicio.total` aunque el Mecánico no tenga permiso directo de
-- escritura en esas tablas (evita que el descuento de stock se bloquee por
-- RLS, sin abrir esas tablas por completo a cualquier rol).
CREATE OR REPLACE FUNCTION fn_actualizar_total_orden(p_id_orden INT)
RETURNS void AS $$
BEGIN
    UPDATE orden_servicio
       SET total = (SELECT COALESCE(SUM(precio_aplicado), 0) FROM detalle_servicio WHERE id_orden_servicio = p_id_orden)
                  + (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_repuesto WHERE id_orden_servicio = p_id_orden)
     WHERE id_orden_servicio = p_id_orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trg_detalle_repuesto_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT stock_actual FROM repuesto WHERE id_repuesto = NEW.id_repuesto) < NEW.cantidad THEN
        RAISE EXCEPTION 'No hay suficiente stock de este repuesto (quedan %)', (SELECT stock_actual FROM repuesto WHERE id_repuesto = NEW.id_repuesto);
    END IF;
    UPDATE repuesto SET stock_actual = stock_actual - NEW.cantidad WHERE id_repuesto = NEW.id_repuesto;
    PERFORM fn_actualizar_total_orden(NEW.id_orden_servicio);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trg_detalle_repuesto_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repuesto SET stock_actual = stock_actual + OLD.cantidad WHERE id_repuesto = OLD.id_repuesto;
    PERFORM fn_actualizar_total_orden(OLD.id_orden_servicio);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trg_detalle_servicio_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM fn_actualizar_total_orden(OLD.id_orden_servicio);
        RETURN OLD;
    ELSE
        PERFORM fn_actualizar_total_orden(NEW.id_orden_servicio);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10.5 Generar factura: operación transaccional. Crea la factura Y marca la
-- orden como "Entregado" en un solo paso — si algo falla a la mitad, Postgres
-- deshace todo (no queda una factura huérfana ni una orden a medio actualizar).
CREATE OR REPLACE FUNCTION fn_generar_factura(p_id_orden INT, p_id_metodo_pago INT)
RETURNS INT AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_iva DECIMAL(10,2);
    v_id_factura INT;
    v_id_estado_actual INT;
    v_id_estado_finalizado INT;
    v_id_estado_entregado INT;
BEGIN
    IF fn_rol_actual() NOT IN ('Administrador', 'Secretario/a') THEN
        RAISE EXCEPTION 'No autorizado para generar facturas';
    END IF;

    SELECT id_estado_orden, total INTO v_id_estado_actual, v_subtotal
    FROM orden_servicio WHERE id_orden_servicio = p_id_orden FOR UPDATE;

    IF v_id_estado_actual IS NULL THEN
        RAISE EXCEPTION 'La orden % no existe', p_id_orden;
    END IF;

    SELECT id_estado_orden INTO v_id_estado_finalizado FROM estado_orden WHERE nombre_estado = 'Finalizado';
    SELECT id_estado_orden INTO v_id_estado_entregado FROM estado_orden WHERE nombre_estado = 'Entregado';

    IF v_id_estado_actual != v_id_estado_finalizado THEN
        RAISE EXCEPTION 'Solo se puede facturar una orden en estado Finalizado';
    END IF;

    IF EXISTS (SELECT 1 FROM factura WHERE id_orden_servicio = p_id_orden) THEN
        RAISE EXCEPTION 'Esta orden ya tiene una factura generada';
    END IF;

    v_iva := ROUND(v_subtotal * 0.13, 2);

    INSERT INTO factura (id_orden_servicio, id_estado_factura, id_metodo_pago, subtotal, iva)
    VALUES (p_id_orden, (SELECT id_estado_factura FROM estado_factura WHERE nombre_estado = 'Pendiente'), p_id_metodo_pago, v_subtotal, v_iva)
    RETURNING id_factura INTO v_id_factura;

    UPDATE orden_servicio SET id_estado_orden = v_id_estado_entregado, fecha_entrega_real = now()
    WHERE id_orden_servicio = p_id_orden;

    RETURN v_id_factura;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10.6 RLS completa por tabla (empleado, cliente, vehiculo, orden_servicio,
-- detalle_servicio, proveedor, repuesto, detalle_repuesto, factura, y los
-- ajustes a usuario) — todo eso vive en database/rls_politicas.sql, un solo
-- archivo con todas las políticas (evita mantenerlas duplicadas en dos
-- lugares). Corre ese archivo completo justo después de este.
