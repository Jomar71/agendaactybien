const Cita = require('../models/Cita');

// Horarios compartidos: la app permite agendar varios pacientes en la misma
// hora. Lo único que se rechaza es el DUPLICADO EXACTO (mismo paciente +
// misma fecha + misma hora). Estas normalizaciones evitan falsos negativos
// por diferencias de formato ('HH:MM' vs 'HH:MM:SS', espacios, mayúsculas).
const toDate = (v) => String(v == null ? '' : v).slice(0, 10);
const toTime = (v) => String(v == null ? '' : v).slice(0, 5);
const toName = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ');

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
      const required = ['fecha', 'hora', 'tutorNombre', 'pacienteNombre', 'modalidad'];
      const missing = required.filter(f => {
        const v = req.body[f];
        return (f === 'modalidad')
          ? !['presencial', 'virtual'].includes(v)
          : (v === undefined || v === null || v === '');
      });
      if (missing.length) {
        return res.status(400).json({ message: `Campos obligatorios faltantes o inválidos: ${missing.join(', ')}` });
      }

      // Solo se bloquea el duplicado exacto. Agendar un segundo paciente en la
      // misma fecha y hora es válido y se guarda con normalidad.
      const duplicate = await Cita.findExactDuplicate(
        req.user.id,
        toDate(req.body.fecha),
        toTime(req.body.hora),
        toName(req.body.pacienteNombre)
      );
      if (duplicate) {
        return res.status(409).json({
          message: 'Este paciente ya tiene una cita registrada en esa fecha y hora.',
          code: 'CITA_DUPLICADA'
        });
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
      const current = await Cita.findById(id, req.user.id);
      if (!current) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }

      // El duplicado exacto se comprueba contra el estado resultante (valores
      // nuevos o, si no llegan, los actuales) excluyendo la propia cita, de
      // modo que reagendar sin cambiar nada nunca se bloquee a sí mismo.
      const nextDate = toDate(req.body.fecha || current.fecha);
      const nextTime = toTime(req.body.hora || current.hora);
      const nextName = toName(req.body.pacienteNombre || current.paciente_nombre);
      const duplicate = await Cita.findExactDuplicate(
        req.user.id, nextDate, nextTime, nextName, id
      );
      if (duplicate) {
        return res.status(409).json({
          message: 'Este paciente ya tiene una cita registrada en esa fecha y hora.',
          code: 'CITA_DUPLICADA'
        });
      }

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
