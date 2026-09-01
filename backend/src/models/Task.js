const pool = require('../config/db');

/**
 * Modelo de Tareas (Mis Tareas).
 * Todas las operaciones están filtradas por user_id.
 * (Adaptado a MySQL: sin RETURNING, se relée la fila tras escribir.)
 */
const Task = {
  // Obtener todas las tareas del usuario
  findAllByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY fecha DESC, hora ASC',
      [userId]
    );
    return result.rows;
  },

  // Obtener una tarea por id (si pertenece al usuario)
  findById: async (id, userId) => {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Crear una tarea
  create: async (userId, data) => {
    const insert = await pool.query(
      `INSERT INTO tasks
        (user_id, fecha, hora, title, description, priority, category,
         reminder_offset, reminder_sound, done)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        data.date ?? null,
        data.time ?? null,
        data.title,
        data.description ?? null,
        data.priority || 'media',
        data.category || 'otro',
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound || 'timbre',
        data.done === true ? 1 : 0
      ]
    );
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [insert.insertId, userId]
    );
    return result.rows[0];
  },

  // Actualizar una tarea existente
  update: async (id, userId, data) => {
    // Si viene 'done', se gestiona el completed_at según el estado
    let doneSql = '';
    const params = [];
    if (data.done === true) {
      doneSql = 'done = 1, completed_at = COALESCE(completed_at, NOW()),';
    } else if (data.done === false) {
      doneSql = 'done = 0, completed_at = NULL,';
    }

    await pool.query(
      `UPDATE tasks SET
         ${doneSql}
         fecha = COALESCE(?, fecha),
         hora = COALESCE(?, hora),
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         priority = COALESCE(?, priority),
         category = COALESCE(?, category),
         reminder_offset = COALESCE(?, reminder_offset),
         reminder_sound = COALESCE(?, reminder_sound)
       WHERE id = ? AND user_id = ?`,
      [
        data.date ?? null,
        data.time ?? null,
        data.title ?? null,
        data.description ?? null,
        data.priority ?? null,
        data.category ?? null,
        (data.reminderOffset === null || data.reminderOffset === undefined) ? null : data.reminderOffset,
        data.reminderSound ?? null,
        id,
        userId
      ]
    );
    void params;

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.rows[0];
  },

  // Eliminar una tarea
  delete: async (id, userId) => {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows ? { id } : null;
  }
};

module.exports = Task;
