const pool = require('../config/db');

/**
 * Modelo de Contactos (Mi Directorio).
 * Todas las operaciones están filtradas por user_id.
 * (Adaptado a MySQL: sin RETURNING, se relée la fila tras escribir.)
 */
const Contact = {
  // Obtener todos los contactos del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  // Obtener un contacto por id
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear un contacto
  create: async (userId, data) => {
    const insert = await pool.query(
      `INSERT INTO contacts (user_id, nombre, telefono, email, relacion, paciente, notas)
       VALUES (?,?,?,?,?,?,?)`,
      [
        userId,
        data.nombre,
        data.telefono,
        data.email ?? null,
        data.relacion ?? null,
        data.paciente ?? null,
        data.notas ?? null
      ]
    );
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [insert.insertId, userId]
    );
    return result.rows[0];
  },

  // Actualizar un contacto
  update: async (id, userId, data) => {
    await pool.query(
      `UPDATE contacts SET
         nombre = COALESCE(?, nombre),
         telefono = COALESCE(?, telefono),
         email = COALESCE(?, email),
         relacion = COALESCE(?, relacion),
         paciente = COALESCE(?, paciente),
         notas = COALESCE(?, notas)
       WHERE id = ? AND user_id = ?`,
      [
        data.nombre ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.relacion ?? null,
        data.paciente ?? null,
        data.notas ?? null,
        id,
        userId
      ]
    );
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Eliminar un contacto
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows ? { id } : null;
  }
};

module.exports = Contact;
