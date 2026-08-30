const Contact = require('../models/Contact');

/**
 * Controlador de Contactos (Mi Directorio).
 * Todas las respuestas se limitan al user_id del token (req.user.id).
 */
const contactController = {
  // GET /api/contactos → lista de contactos del usuario
  getAll: async (req, res) => {
    try {
      const contacts = await Contact.findAllByUser(req.user.id);
      res.json(contacts);
    } catch (error) {
      console.error('Error getting contacts:', error);
      res.status(500).json({ message: 'Error del servidor al obtener contactos', error: error.message });
    }
  },

  // GET /api/contactos/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await Contact.findById(id, req.user.id);
      if (!contact) {
        return res.status(404).json({ message: 'Contacto no encontrado' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Error getting contact:', error);
      res.status(500).json({ message: 'Error del servidor al obtener el contacto', error: error.message });
    }
  },

  // POST /api/contactos → crea un contacto
  create: async (req, res) => {
    try {
      if (!req.body.nombre || !String(req.body.nombre).trim()) {
        return res.status(400).json({ message: 'El nombre del contacto es obligatorio' });
      }
      if (!req.body.telefono || !String(req.body.telefono).trim()) {
        return res.status(400).json({ message: 'El teléfono del contacto es obligatorio' });
      }
      const contact = await Contact.create(req.user.id, req.body);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ message: 'Error del servidor al crear el contacto', error: error.message });
    }
  },

  // PUT /api/contactos/:id → actualiza un contacto
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await Contact.update(id, req.user.id, req.body);
      if (!contact) {
        return res.status(404).json({ message: 'Contacto no encontrado' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ message: 'Error del servidor al actualizar el contacto', error: error.message });
    }
  },

  // DELETE /api/contactos/:id → elimina un contacto
  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await Contact.delete(id, req.user.id);
      if (!contact) {
        return res.status(404).json({ message: 'Contacto no encontrado' });
      }
      res.json({ message: 'Contacto eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ message: 'Error del servidor al eliminar el contacto', error: error.message });
    }
  }
};

module.exports = contactController;
