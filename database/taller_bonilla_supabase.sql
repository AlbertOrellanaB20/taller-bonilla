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
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura ENABLE ROW LEVEL SECURITY;

-- Función helper: obtiene el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION fn_rol_actual()
RETURNS TEXT AS $$
    SELECT r.nombre_rol FROM usuario u
    JOIN rol r ON r.id_rol = u.id_rol
    WHERE u.auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE;

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
-- (nombre de rol corregido: antes decía 'Cajero', que ya no existe en la
-- tabla `rol` — el rol final se llama 'Secretario/a', ver sección 6 arriba).
CREATE POLICY "facturas_admin_secretaria" ON factura
FOR SELECT USING (fn_rol_actual() IN ('Administrador', 'Secretario/a'));

-- 9. REALTIME: habilitar para que los cambios se reflejen en vivo en el frontend
ALTER PUBLICATION supabase_realtime ADD TABLE orden_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_repuesto;
ALTER PUBLICATION supabase_realtime ADD TABLE factura;
ALTER PUBLICATION supabase_realtime ADD TABLE repuesto;
