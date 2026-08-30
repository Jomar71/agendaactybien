const Task = require('../models/Task');

/**
 * Controlador de Tareas (Mis Tareas).
 * Todas las respuestas se limitan al user_id del token (req.user.id).
 */
const taskController = {
  // GET /api/tareas → lista de tareas del usuario
  getAll: async (req, res) => {
    try {
      const tasks = await Task.findAllByUser(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ message: 'Error del servidor al obtener tareas', error: error.message });
    }
  },

  // GET /api/tareas/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.findById(id, req.user.id);
      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error getting task:', error);
      res.status(500).json({ message: 'Error del servidor al obtener la tarea', error: error.message });
    }
  },

  // POST /api/tareas → crea una tarea
  create: async (req, res) => {
    try {
      if (!req.body.title || !String(req.body.title).trim()) {
        return res.status(400).json({ message: 'El título de la tarea es obligatorio' });
      }
      const task = await Task.create(req.user.id, req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Error del servidor al crear la tarea', error: error.message });
    }
  },

  // PUT /api/tareas/:id → actualiza una tarea
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.update(id, req.user.id, req.body);
      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Error del servidor al actualizar la tarea', error: error.message });
    }
  },

  // DELETE /api/tareas/:id → elimina una tarea
  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.delete(id, req.user.id);
      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }
      res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Error del servidor al eliminar la tarea', error: error.message });
    }
  }
};

module.exports = taskController;
