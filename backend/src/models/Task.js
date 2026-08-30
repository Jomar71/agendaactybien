const pool = require('../config/db');

/**
 * Modelo de Tareas (Mis Tareas).
 * Todas las operaciones están filtradas por user_id.
 */
const Task = {
  // Obtener todas las tareas del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY fecha DESC, hora ASC',
      [userId]
    );
    return result.rows;
  },

  // Obtener una tarea por id (si pertenece al usuario)
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear una tarea
  create: async (userId, data) => {
    const result = await pool.query(
      `INSERT INTO tasks
        (user_id, fecha, hora, title, description, priority, category,
         reminder_offset, reminder_sound, done)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        userId,
        data.date || null,
        data.time || null,
        data.title,
        data.description || null,
        data.priority || 'media',
        data.category || 'otro',
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound || 'timbre',
        data.done === true
      ]
    );
    return result.rows[0];
  },

  // Actualizar una tarea existente
  update: async (id, userId, data) => {
    const result = await pool.query(
      `UPDATE tasks SET
         fecha = COALESCE($3, fecha),
         hora = COALESCE($4, hora),
         title = COALESCE($5, title),
         description = COALESCE($6, description),
         priority = COALESCE($7, priority),
         category = COALESCE($8, category),
         reminder_offset = COALESCE($9, reminder_offset),
         reminder_sound = COALESCE($10, reminder_sound),
         done = COALESCE($11, done),
         completed_at = CASE WHEN $11 THEN NOW() WHEN NOT $11 THEN NULL ELSE completed_at END
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        data.date ?? null,
        data.time ?? null,
        data.title ?? null,
        data.description ?? null,
        data.priority ?? null,
        data.category ?? null,
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound ?? null,
        data.done === undefined ? null : data.done
      ]
    );
    return result.rows[0];
  },

  // Eliminar una tarea
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = Task;
