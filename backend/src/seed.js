/**
 * Seed / inicialización de la base de datos para la plataforma
 * Actitud & Bienestar (MySQL).
 *
 * Crea (si no existen) los usuarios por defecto y los contactos iniciales.
 * Convierte el email demo del login del frontend en un usuario REAL
 * con contraseña encriptada (bcrypt) para poder autenticarse con JWT.
 *
 * Uso:
 *   node backend/src/seed.js
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

// Usuario por defecto que coincide con el login que ya trae el frontend
// pre-llenado (paola@terapia / pao1234567). CÁMBIALO en producción.
const DEFAULT_USERS = [
  { email: 'paola@terapia', password: 'pao1234567', nombre: 'Paola' }
];

// Contactos iniciales de Mi Directorio (vinculados al usuario anterior)
const DEFAULT_CONTACTS = [
  {
    nombre: 'Laura Morales Gómez',
    telefono: '3109876543',
    email: 'laura.morales@ejemplo.com',
    relacion: 'Madre',
    paciente: 'Lucas Morales (7 años)',
    notas: 'Madre de Lucas. Prefiere contacto por WhatsApp después de las 2:00 PM.'
  },
  {
    nombre: 'Carlos Eduardo Restrepo',
    telefono: '3201234567',
    email: 'carlos.restrepo@ejemplo.com',
    relacion: 'Padre',
    paciente: 'Valeria Restrepo (14 años)',
    notas: 'Padre de Valeria. Seguimiento a sesiones de orientación vocacional.'
  },
  {
    nombre: 'Dra. María Elena Suárez',
    telefono: '3005551234',
    email: 'm.suarez@colegio.edu.co',
    relacion: 'Terapeuta',
    paciente: 'Orientadora Escolar',
    notas: 'Psicoorientadora del Colegio San José. Enlace para informes escolares.'
  }
];

async function seed() {
  console.log('🌱 Iniciando seed de Actitud & Bienestar (MySQL)...');

  for (const u of DEFAULT_USERS) {
    const existing = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
    let userId;

    if (existing.rows.length) {
      userId = existing.rows[0].id;
      console.log(`ℹ️  Usuario ${u.email} ya existe (id=${userId}).`);
      const row = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
      const ok = row.rows[0] && (await bcrypt.compare(u.password, row.rows[0].password));
      if (!ok && process.env.SEED_FORCE_PASSWORD === 'true') {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password, salt);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
        console.log(`🔑 Contraseña de ${u.email} restablecida a la predeterminada.`);
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);
      const result = await pool.query(
        `INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)`,
        [u.nombre, u.email, hash, 'admin']
      );
      userId = result.insertId;
      console.log(`✅ Usuario creado: ${u.email} (id=${userId})`);
    }

    // Sembrar contactos iniciales SOLO si el usuario aún no tiene ninguno
    const contactsCount = await pool.query(
      'SELECT COUNT(*) AS n FROM contacts WHERE user_id = ?', [userId]
    );
    if (Number(contactsCount.rows[0].n) === 0) {
      for (const c of DEFAULT_CONTACTS) {
        await pool.query(
          `INSERT INTO contacts (user_id, nombre, telefono, email, relacion, paciente, notas)
           VALUES (?,?,?,?,?,?,?)`,
          [userId, c.nombre, c.telefono, c.email, c.relacion, c.paciente, c.notas]
        );
      }
      console.log(`👥 Contactos iniciales sembrados para ${u.email}.`);
    }
  }

  console.log('🎉 Seed completado.');
  await pool.raw.end();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
