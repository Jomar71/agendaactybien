const pool = require('../config/db');

const Client = {
  // Find client by ID
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Find all clients
  findAll: async () => {
    const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows;
  },

  // Create a new client
  create: async (nombre, telefono, email, userId) => {
    const result = await pool.query(
      'INSERT INTO clients (nombre, telefono, email, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, telefono, email, userId]
    );
    return result.rows[0];
  },

  // Update a client
  update: async (id, nombre, telefono, email) => {
    const result = await pool.query(
      'UPDATE clients SET nombre = $1, telefono = $2, email = $3 WHERE id = $4 RETURNING *',
      [nombre, telefono, email, id]
    );
    return result.rows[0];
  },

  // Delete a client
  delete: async (id) => {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Client;