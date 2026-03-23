const pool = require('../config/db');

const Service = {
  // Find all services
  findAll: async () => {
    const result = await pool.query('SELECT * FROM services ORDER BY nombre');
    return result.rows;
  },

  // Find service by ID
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Create a new service
  create: async (nombre, duracion, precio, descripcion) => {
    const result = await pool.query(
      'INSERT INTO services (nombre, duracion, precio, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, duracion, precio, descripcion]
    );
    return result.rows[0];
  },

  // Update a service
  update: async (id, nombre, duracion, precio, descripcion) => {
    const result = await pool.query(
      'UPDATE services SET nombre = $1, duracion = $2, precio = $3, descripcion = $4 WHERE id = $5 RETURNING *',
      [nombre, duracion, precio, descripcion, id]
    );
    return result.rows[0];
  },

  // Delete a service
  delete: async (id) => {
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Service;