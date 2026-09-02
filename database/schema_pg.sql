-- =====================================================================
-- ACTITUD & BIENESTAR – Esquema de Base de Datos PostgreSQL
-- (referencia: el backend ya lo aplica automáticamente al arrancar
--  vía backend/src/migrate.js; este archivo sirve p. ej. para crear la
--  BD desde la consola/panel de pxxl de forma manual)
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id INT NULL,
    professional_name VARCHAR(120) NULL,
    professional_specialty VARCHAR(120) NULL,
    tutor_nombre VARCHAR(120) NOT NULL,
    paciente_nombre VARCHAR(120) NOT NULL,
    paciente_edad INT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    telefono VARCHAR(25) NULL,
    email VARCHAR(120) NULL,
    motivo TEXT NULL,
    motivo_detalle TEXT NULL,
    reminder_offset INT NULL,
    reminder_sound VARCHAR(40) DEFAULT 'timbre',
    estado VARCHAR(20) DEFAULT 'confirmada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha DATE NULL,
    hora TIME NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(20) DEFAULT 'media',
    category VARCHAR(40) DEFAULT 'otro',
    reminder_offset INT NULL,
    reminder_sound VARCHAR(40) DEFAULT 'timbre',
    done BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(120) NULL,
    relacion VARCHAR(80) NULL,
    paciente VARCHAR(180) NULL,
    notas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citas_user  ON citas(user_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_tasks_user  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_fecha ON tasks(fecha);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);