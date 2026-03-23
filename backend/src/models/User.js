const pool = require('../config/db');

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await pool.query('SELECT id, nombre, email, rol, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Create a new user
  create: async (nombre, email, hashedPassword) => {
    const result = await pool.query(
      'INSERT INTO users (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, created_at',
      [nombre, email, hashedPassword, 'admin']
    );
    return result.rows[0];
  },

  // Get all users
  findAll: async () => {
    const result = await pool.query('SELECT id, nombre, email, rol, created_at FROM users');
    return result.rows;
  }
};

module.exports = User;