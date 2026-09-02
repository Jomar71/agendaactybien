/**
 * Inicialización idempotente de la base de datos (Actitud & Bienestar).
 *
 * Se ejecuta en cada arranque del servidor:
 *  - Crea las tablas (users, citas, tasks, contacts) si no existen.
 *  - Crea índices de apoyo en PostgreSQL.
 *  - Siembra el usuario admin demo (paola@terapia) solo si no existe.
 *
 * Compatible con MySQL (local) y PostgreSQL (producción/pxxl): se usan
 * sentencias CREATE TABLE IF NOT EXISTS estándar y placeholders '?'
 * (el adaptador de backend/src/config/db.js los convierte a $n en PG).
 *
 * Uso directo (CLI):
 *   node backend/src/migrate.js
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INT NULL,
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
  )`,

  `CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INT NULL,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(120) NULL,
    relacion VARCHAR(80) NULL,
    paciente VARCHAR(180) NULL,
    notas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

// Índices de apoyo: MySQL local no los necesita (CREATE INDEX IF NOT EXISTS
// no existe en MySQL y un intento repetido fallaría); PostgreSQL sí los usa.
const INDEXES = pool.engine === 'postgres'
  ? [
      'CREATE INDEX IF NOT EXISTS idx_citas_user ON citas(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_fecha ON tasks(fecha)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id)'
    ]
  : [];

// Foreign keys (solo si las tablas son nuevas y en PostgreSQL para evitar
// conflictos con tablas preexistentes sin la columna de usuario).
const FOREIGN_KEYS = pool.engine === 'postgres'
  ? [
      `DO $$ BEGIN
         ALTER TABLE citas ADD CONSTRAINT fk_citas_user FOREIGN KEY (user_id)
           REFERENCES users(id) ON DELETE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user FOREIGN KEY (user_id)
           REFERENCES users(id) ON DELETE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         ALTER TABLE contacts ADD CONSTRAINT fk_contacts_user FOREIGN KEY (user_id)
           REFERENCES users(id) ON DELETE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`
    ]
  : [];

const DEMO_USER = {
  email: 'paola@terapia',
  password: 'pao1234567',
  nombre: 'Paola',
  rol: 'admin'
};

async function seedDemoUser() {
  const existing = await pool.query('SELECT id FROM users WHERE email = ?', [DEMO_USER.email]);
  if (existing.rows.length > 0) {
    return false;
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(DEMO_USER.password, salt);
  await pool.query(
    'INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [DEMO_USER.nombre, DEMO_USER.email, hash, DEMO_USER.rol]
  );
  return true;
}

let initPromise = null;

/** Ejecuta (una sola vez por proceso) la creación de esquema + usuario demo. */
function initDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      for (const sql of TABLES) await pool.query(sql);
      for (const sql of INDEXES) {
        try { await pool.query(sql); } catch (e) { console.warn('Índice no creado:', e.message); }
      }
      for (const sql of FOREIGN_KEYS) {
        try { await pool.query(sql); } catch (e) { console.warn('FK no creada:', e.message); }
      }
      const seeded = await seedDemoUser();
      return { tablesReady: true, seeded };
    })().catch((err) => {
      initPromise = null; // permitir reintentar en un futuro arranque
      throw err;
    });
  }
  return initPromise;
}

// Ejecución directa desde CLI (node backend/src/migrate.js)
if (require.main === module) {
  initDatabase()
    .then((r) => {
      console.log('✅ Base de datos lista.');
      console.log(r.seeded ? `👤 Usuario demo creado: ${DEMO_USER.email}` : `ℹ️  Usuario ${DEMO_USER.email} ya existía.`);
      return pool.raw.end();
    })
    .catch((err) => {
      console.error('❌ Error inicializando la base de datos:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };