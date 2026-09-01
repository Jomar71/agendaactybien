const pool = require('../config/db');

/**
 * Modelo de Citas (Mi Agenda).
 * Todas las operaciones están filtradas por user_id para que cada usuario
 * solo acceda a sus propias citas.
 * (Adaptado a MySQL: sin RETURNING, se relée la fila tras escribir.)
 */
const Cita = {
  // Obtener todas las citas del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM citas WHERE user_id = ? ORDER BY fecha DESC, hora ASC',
      [userId]
    );
    return result.rows;
  },

  // Obtener una cita por id (si pertenece al usuario)
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM citas WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear una cita (userId se asigna del token, nunca del cuerpo)
  create: async (userId, data) => {
    const insert = await pool.query(
      `INSERT INTO citas
        (user_id, professional_id, professional_name, professional_specialty,
         tutor_nombre, paciente_nombre, paciente_edad, fecha, hora,
         telefono, email, motivo, motivo_detalle, reminder_offset, reminder_sound, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        data.professionalId ?? null,
        data.professionalName ?? null,
        data.professionalSpecialty ?? null,
        data.tutorNombre ?? null,
        data.pacienteNombre ?? null,
        data.pacienteEdad ?? null,
        data.fecha ?? null,
        data.hora ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.motivo ?? null,
        data.motivoDetalle ?? null,
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound || 'timbre',
        data.estado || 'confirmada'
      ]
    );
    const result = await pool.query(
      'SELECT * FROM citas WHERE id = ? AND user_id = ?',
      [insert.insertId, userId]
    );
    return result.rows[0];
  },

  // Actualizar una cita existente (si pertenece al usuario)
  update: async (id, userId, data) => {
    await pool.query(
      `UPDATE citas SET
         professional_id = COALESCE(?, professional_id),
         professional_name = COALESCE(?, professional_name),
         professional_specialty = COALESCE(?, professional_specialty),
         tutor_nombre = COALESCE(?, tutor_nombre),
         paciente_nombre = COALESCE(?, paciente_nombre),
         paciente_edad = COALESCE(?, paciente_edad),
         fecha = COALESCE(?, fecha),
         hora = COALESCE(?, hora),
         telefono = COALESCE(?, telefono),
         email = COALESCE(?, email),
         motivo = COALESCE(?, motivo),
         motivo_detalle = COALESCE(?, motivo_detalle),
         reminder_offset = COALESCE(?, reminder_offset),
         reminder_sound = COALESCE(?, reminder_sound),
         estado = COALESCE(?, estado)
       WHERE id = ? AND user_id = ?`,
      [
        data.professionalId ?? null,
        data.professionalName ?? null,
        data.professionalSpecialty ?? null,
        data.tutorNombre ?? null,
        data.pacienteNombre ?? null,
        data.pacienteEdad ?? null,
        data.fecha ?? null,
        data.hora ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.motivo ?? null,
        data.motivoDetalle ?? null,
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound ?? null,
        data.estado ?? null,
        id,
        userId
      ]
    );
    const result = await pool.query(
      'SELECT * FROM citas WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Eliminar una cita (si pertenece al usuario)
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM citas WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows ? { id } : null;
  }
};

module.exports = Cita;
