-- =====================================================================
-- ACTITUD & BIENESTAR – Esquema de Base de Datos MySQL
-- Plataforma de Agendamiento Psicológico Infantil y Juvenil
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla de Usuarios (Autenticación y Perfil)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    professional_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. Tabla de Citas (Mi Agenda)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_citas_user (user_id),
    KEY idx_citas_fecha (fecha),
    CONSTRAINT fk_citas_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. Tabla de Tareas (Mis Tareas - Asistente Terapéutico)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    fecha DATE NULL,
    hora TIME NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(20) DEFAULT 'media',   -- baja | media | alta
    category VARCHAR(40) DEFAULT 'otro',    -- cita | medicacion | tarea | ejercicio | otro
    reminder_offset INT NULL,
    reminder_sound VARCHAR(40) DEFAULT 'timbre',
    done TINYINT(1) DEFAULT 0,
    completed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tasks_user (user_id),
    KEY idx_tasks_fecha (fecha),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. Tabla de Contactos (Mi Directorio Telefónico)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(120) NULL,
    relacion VARCHAR(80) NULL,      -- Madre, Padre, Tutor, Familiar, Terapeuta, Otro
    paciente VARCHAR(180) NULL,     -- Ej: "Lucas Morales (7 años)"
    notas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_contacts_user (user_id),
    CONSTRAINT fk_contacts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
