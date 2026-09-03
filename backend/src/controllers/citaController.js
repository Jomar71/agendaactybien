const Cita = require('../models/Cita');

/**
 * Controlador de Citas (Mi Agenda).
 * Todas las respuestas se limitan al user_id del token (req.user.id).
 */
const citaController = {
  // GET /api/citas → lista de citas del usuario
  //  - Admin: ve sus propias citas (user_id).
  //  - Terapeuta: ve las citas donde es el profesional (professional_id),
  //    sin importar quién las haya creado.
  getAll: async (req, res) => {
    try {
      const user = req.user;
      const citas = user.rol === 'terapeuta'
        ? await Cita.findAllByProfessional(user.professional_id)
        : await Cita.findAllByUser(user.id);
      res.json(citas);
    } catch (error) {
      console.error('Error getting citas:', error);
      res.status(500).json({ message: 'Error del servidor al obtener citas', error: error.message });
    }
  },

  // GET /api/citas/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const cita = await Cita.findById(id, req.user.id);
      if (!cita) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      res.json(cita);
    } catch (error) {
      console.error('Error getting cita:', error);
      res.status(500).json({ message: 'Error del servidor al obtener la cita', error: error.message });
    }
  },

  // POST /api/citas → crea una cita
  create: async (req, res) => {
    try {
      const required = ['fecha', 'hora', 'tutorNombre', 'pacienteNombre'];
      const missing = required.filter(f => {
        const v = req.body[f];
        return v === undefined || v === null || v === '';
      });
      if (missing.length) {
        return res.status(400).json({ message: `Campos obligatorios faltantes: ${missing.join(', ')}` });
      }

      const cita = await Cita.create(req.user.id, req.body);
      res.status(201).json(cita);
    } catch (error) {
      console.error('Error creating cita:', error);
      res.status(500).json({ message: 'Error del servidor al crear la cita', error: error.message });
    }
  },

  // PUT /api/citas/:id → actualiza una cita
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const cita = await Cita.update(id, req.user.id, req.body);
      if (!cita) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      res.json(cita);
    } catch (error) {
      console.error('Error updating cita:', error);
      res.status(500).json({ message: 'Error del servidor al actualizar la cita', error: error.message });
    }
  },

  // DELETE /api/citas/:id → elimina una cita
  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const cita = await Cita.delete(id, req.user.id);
      if (!cita) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      res.json({ message: 'Cita eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting cita:', error);
      res.status(500).json({ message: 'Error del servidor al eliminar la cita', error: error.message });
    }
  }
};

module.exports = citaController;
