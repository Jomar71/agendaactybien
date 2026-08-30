const pool = require('../config/db');

/**
 * Modelo de Contactos (Mi Directorio).
 * Todas las operaciones están filtradas por user_id.
 */
const Contact = {
  // Obtener todos los contactos del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  // Obtener un contacto por id
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear un contacto
  create: async (userId, data) => {
    const result = await pool.query(
      `INSERT INTO contacts (user_id, nombre, telefono, email, relacion, paciente, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        userId,
        data.nombre,
        data.telefono,
        data.email || null,
        data.relacion || null,
        data.paciente || null,
        data.notas || null
      ]
    );
    return result.rows[0];
  },

  // Actualizar un contacto
  update: async (id, userId, data) => {
    const result = await pool.query(
      `UPDATE contacts SET
         nombre = COALESCE($3, nombre),
         telefono = COALESCE($4, telefono),
         email = COALESCE($5, email),
         relacion = COALESCE($6, relacion),
         paciente = COALESCE($7, paciente),
         notas = COALESCE($8, notas)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        data.nombre ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.relacion ?? null,
        data.paciente ?? null,
        data.notas ?? null
      ]
    );
    return result.rows[0];
  },

  // Eliminar un contacto
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = Contact;
