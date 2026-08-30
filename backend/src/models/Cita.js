const pool = require('../config/db');

/**
 * Modelo de Citas (Mi Agenda).
 * Todas las operaciones están filtradas por user_id para que cada usuario
 * solo acceda a sus propias citas.
 */
const Cita = {
  // Obtener todas las citas del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM citas WHERE user_id = $1 ORDER BY fecha DESC, hora ASC',
      [userId]
    );
    return result.rows;
  },

  // Obtener una cita por id (si pertenece al usuario)
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM citas WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear una cita (userId se asigna del token, nunca del cuerpo)
  create: async (userId, data) => {
    const result = await pool.query(
      `INSERT INTO citas
        (user_id, professional_id, professional_name, professional_specialty,
         tutor_nombre, paciente_nombre, paciente_edad, fecha, hora,
         telefono, email, motivo, motivo_detalle, reminder_offset, reminder_sound, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        userId,
        data.professionalId || null,
        data.professionalName || null,
        data.professionalSpecialty || null,
        data.tutorNombre || null,
        data.pacienteNombre || null,
        data.pacienteEdad || null,
        data.fecha || null,
        data.hora || null,
        data.telefono || null,
        data.email || null,
        data.motivo || null,
        data.motivoDetalle || null,
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound || 'timbre',
        data.estado || 'confirmada'
      ]
    );
    return result.rows[0];
  },

  // Actualizar una cita existente (si pertenece al usuario)
  update: async (id, userId, data) => {
    const result = await pool.query(
      `UPDATE citas SET
         professional_id = COALESCE($3, professional_id),
         professional_name = COALESCE($4, professional_name),
         professional_specialty = COALESCE($5, professional_specialty),
         tutor_nombre = COALESCE($6, tutor_nombre),
         paciente_nombre = COALESCE($7, paciente_nombre),
         paciente_edad = COALESCE($8, paciente_edad),
         fecha = COALESCE($9, fecha),
         hora = COALESCE($10, hora),
         telefono = COALESCE($11, telefono),
         email = COALESCE($12, email),
         motivo = COALESCE($13, motivo),
         motivo_detalle = COALESCE($14, motivo_detalle),
         reminder_offset = COALESCE($15, reminder_offset),
         reminder_sound = COALESCE($16, reminder_sound),
         estado = COALESCE($17, estado)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
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
        data.reminderSound ?? null,
        data.estado ?? null
      ]
    );
    return result.rows[0];
  },

  // Eliminar una cita (si pertenece al usuario)
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM citas WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = Cita;
