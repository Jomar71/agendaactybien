const Product = require('../models/Product');

const productController = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.findAll();
      res.json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get product by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new product
  createProduct: async (req, res) => {
    try {
      const { nombre, precio, stock, imagen, descripcion } = req.body;
      
      // Validate required fields
      if (!nombre || !precio) {
        return res.status(400).json({ message: 'Nombre y precio son obligatorios' });
      }

      const newProduct = await Product.create(nombre, precio, stock || 0, imagen, descripcion);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update a product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, precio, stock, imagen, descripcion } = req.body;
      
      const product = await Product.update(id, nombre, precio, stock, imagen, descripcion);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete a product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.delete(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = productController;