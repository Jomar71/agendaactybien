const pool = require('../config/db');

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await pool.query('SELECT id, nombre, email, rol, professional_id, created_at FROM users WHERE id = ?', [id]);
    return result.rows[0];
  },

  // Create a new user
  create: async (nombre, email, hashedPassword, rol = 'admin', professionalId = null) => {
    const insert = await pool.query(
      'INSERT INTO users (nombre, email, password, rol, professional_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol, professionalId]
    );
    const result = await pool.query(
      'SELECT id, nombre, email, rol, professional_id, created_at FROM users WHERE id = ?',
      [insert.insertId]
    );
    return result.rows[0];
  },

  // Get all users
  findAll: async () => {
    const result = await pool.query('SELECT id, nombre, email, rol, professional_id, created_at FROM users');
    return result.rows;
  }
};

module.exports = User;
