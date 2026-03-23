const Client = require('../models/Client');

const clientController = {
  // Get all clients
  getAllClients: async (req, res) => {
    try {
      const clients = await Client.findAll();
      res.json(clients);
    } catch (error) {
      console.error('Error getting clients:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get client by ID
  getClientById: async (req, res) => {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Error getting client:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new client
  createClient: async (req, res) => {
    try {
      const { nombre, telefono, email, userId } = req.body;
      
      // Validate required fields
      if (!nombre || !telefono || !email) {
        return res.status(400).json({ message: 'Nombre, teléfono y email son obligatorios' });
      }

      const newClient = await Client.create(nombre, telefono, email, userId);
      res.status(201).json(newClient);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update a client
  updateClient: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, telefono, email } = req.body;
      
      const client = await Client.update(id, nombre, telefono, email);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete a client
  deleteClient: async (req, res) => {
    try {
      const { id } = req.params;
      const client = await Client.delete(id);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = clientController;