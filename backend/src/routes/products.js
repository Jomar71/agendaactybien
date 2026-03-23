const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (public)
router.get('/', productController.getAllProducts);

// Get product by ID (public)
router.get('/:id', productController.getProductById);

// Create a new product (admin only)
router.post('/', authenticateToken, authorizeAdmin, [
  body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], productController.createProduct);

// Update a product (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, [
  body('nombre').optional().trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('Precio must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], productController.updateProduct);

// Delete a product (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, productController.deleteProduct);

module.exports = router;