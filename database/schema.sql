-- =====================================================================
-- ACTITUD & BIENESTAR – Esquema de Base de Datos PostgreSQL
-- Plataforma de Agendamiento Psicológico Infantil y Juvenil
-- =====================================================================

-- Extensión para soporte de UUIDs si es requerida
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Tabla de Usuarios (Autenticación y Perfil)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. Tabla de Citas (Mi Agenda)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    professional_id INTEGER,
    professional_name VARCHAR(120),
    professional_specialty VARCHAR(120),
    tutor_nombre VARCHAR(120) NOT NULL,
    paciente_nombre VARCHAR(120) NOT NULL,
    paciente_edad INTEGER,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    telefono VARCHAR(25),
    email VARCHAR(120),
    motivo TEXT,
    motivo_detalle TEXT,
    reminder_offset INTEGER,
    reminder_sound VARCHAR(40) DEFAULT 'timbre',
    estado VARCHAR(20) DEFAULT 'confirmada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. Tabla de Tareas (Mis Tareas - Asistente Terapéutico)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fecha DATE,
    hora TIME,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'media',   -- baja | media | alta
    category VARCHAR(30) DEFAULT 'otro',    -- cita | medicacion | tarea | ejercicio | otro
    reminder_offset INTEGER,
    reminder_sound VARCHAR(40) DEFAULT 'timbre',
    done BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. Tabla de Contactos (Mi Directorio Telefónico)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(25) NOT NULL,
    email VARCHAR(120),
    relacion VARCHAR(60),       -- Madre, Padre, Tutor, Familiar, Terapeuta, Otro
    paciente VARCHAR(160),      -- Ej: "Lucas Morales (7 años)"
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Índices para optimizar el rendimiento por usuario
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_citas_user ON citas(user_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_fecha ON tasks(fecha);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);