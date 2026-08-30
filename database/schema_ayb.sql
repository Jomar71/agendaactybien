-- =====================================================================
-- ACTITUD & BIENESTAR – Tablas específicas de la plataforma terapéutica
-- (además de las tablas base del demo "NailArt Studio" en schema.sql)
--
-- Las tablas creadas aquí están vinculadas a users(id) para que cada
-- usuario autenticado vea SOLO sus propios registros (Citas, Tareas y
-- Contactos/Directorio). Ejecuta este archivo en el mismo PostgreSQL.
-- =====================================================================

-- Nota: se reutiliza la tabla `users` de schema.sql para la autenticación.

-- ---------------------------------------------------------------------
-- Citas (Mi Agenda) – forma libre de la aplicación real
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    professional_id INTEGER,
    professional_name VARCHAR(120),
    professional_specialty VARCHAR(120),
    tutor_nombre VARCHAR(120),
    paciente_nombre VARCHAR(120),
    paciente_edad INTEGER,
    fecha DATE,
    hora TIME,
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
-- Tareas (Mis Tareas)
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
-- Contactos (Mi Directorio)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(25) NOT NULL,
    email VARCHAR(120),
    relacion VARCHAR(60),       -- Madre, Padre, Tutor, Familiar, Terapeuta, Otro
    paciente VARCHAR(160),      -- "Nombre del paciente (edad años)"
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para acelerar las consultas repetidas por usuario
CREATE INDEX IF NOT EXISTS idx_citas_user ON citas(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
