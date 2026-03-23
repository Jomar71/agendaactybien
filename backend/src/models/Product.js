const pool = require('../config/db');

const Product = {
  // Find all products
  findAll: async () => {
    const result = await pool.query('SELECT * FROM products ORDER BY nombre');
    return result.rows;
  },

  // Find product by ID
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Create a new product
  create: async (nombre, precio, stock, imagen, descripcion) => {
    const result = await pool.query(
      'INSERT INTO products (nombre, precio, stock, imagen, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, precio, stock, imagen, descripcion]
    );
    return result.rows[0];
  },

  // Update a product
  update: async (id, nombre, precio, stock, imagen, descripcion) => {
    const result = await pool.query(
      'UPDATE products SET nombre = $1, precio = $2, stock = $3, imagen = $4, descripcion = $5 WHERE id = $6 RETURNING *',
      [nombre, precio, stock, imagen, descripcion, id]
    );
    return result.rows[0];
  },

  // Delete a product
  delete: async (id) => {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Product;