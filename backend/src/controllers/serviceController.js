const Service = require('../models/Service');

const serviceController = {
  // Get all services
  getAllServices: async (req, res) => {
    try {
      const services = await Service.findAll();
      res.json(services);
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get service by ID
  getServiceById: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error getting service:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new service
  createService: async (req, res) => {
    try {
      const { nombre, duracion, precio, descripcion } = req.body;
      
      // Validate required fields
      if (!nombre || !duracion || !precio) {
        return res.status(400).json({ message: 'Nombre, duración y precio son obligatorios' });
      }

      const newService = await Service.create(nombre, duracion, precio, descripcion);
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update a service
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, duracion, precio, descripcion } = req.body;
      
      const service = await Service.update(id, nombre, duracion, precio, descripcion);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete a service
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.delete(id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = serviceController;