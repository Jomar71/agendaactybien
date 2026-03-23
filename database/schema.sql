-- Database Schema for NailArt Studio (PostgreSQL)
-- Create the database using psql or your DB manager: CREATE DATABASE spa_unas_db;

-- Extension for generating UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for admin authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    duracion INTEGER NOT NULL, -- duration in minutes
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    imagen VARCHAR(255),
    descripcion TEXT
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    service_id INTEGER REFERENCES services(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, confirmada, cancelada
    pago_estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, confirmado, rechazado
    comprobante_url VARCHAR(255),
    metodo_pago VARCHAR(20), -- nequi, transferencia
    abono_monto DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    monto DECIMAL(10, 2) NOT NULL,
    metodo VARCHAR(20) NOT NULL, -- nequi, transferencia
    comprobante VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, confirmado, rechazado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample services
INSERT INTO services (nombre, duracion, precio, descripcion) VALUES
('Manicura Básica', 45, 25000.00, 'Manicura con corte, limado, empuje de cutículas y esmalte básico'),
('Manicura en Gel', 60, 45000.00, 'Manicura con esmalte semi-permanente en gel'),
('Uñas Acrílicas', 90, 70000.00, 'Uñas postizas en acrílico con diseño opcional'),
('Mantenimiento Acrílicas', 60, 45000.00, 'Relleno y mantenimiento de uñas acrílicas'),
('Polygel', 90, 80000.00, 'Uñas semi-permanentes con técnica polygel'),
('Pedicura Spa', 60, 40000.00, 'Pedicura completa con hidratación y esmalte');

-- Insert sample products
INSERT INTO products (nombre, precio, stock, imagen, descripcion) VALUES
('Esmaltes semipermanentes', 18000.00, 50, 'esmalte_gel.jpg', 'Esmalte semipermanente en diferentes colores'),
('Aceite para cutículas', 12000.00, 30, 'aceite_cuticulas.jpg', 'Hidratante para cutículas con vitamina E'),
('Crema hidratante', 15000.00, 25, 'crema_hidratante.jpg', 'Crema nutritiva para manos y uñas'),
('Kit de cuidado', 45000.00, 15, 'kit_cuidado.jpg', 'Kit completo con todo lo necesario para el cuidado de manos y uñas');

-- Insert admin user (password should be hashed in real app)
INSERT INTO users (nombre, email, password, rol) VALUES
('Admin', 'admin@nailartstudio.com', '$2b$10$8K1p/aLrZTUmzX4Gz3B4UuLQJwW9V7vRlqyY3oLsGmJnKcIjKdEg.', 'admin');