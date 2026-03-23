const express = require('express');
const { body } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all services (public)
router.get('/', serviceController.getAllServices);

// Get service by ID (public)
router.get('/:id', serviceController.getServiceById);

// Create a new service (admin only)
router.post('/', authenticateToken, authorizeAdmin, [
  body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('duracion').isInt({ min: 1 }).withMessage('Duración must be a positive integer'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio must be a positive number')
], serviceController.createService);

// Update a service (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, [
  body('nombre').optional().trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('duracion').optional().isInt({ min: 1 }).withMessage('Duración must be a positive integer'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('Precio must be a positive number')
], serviceController.updateService);

// Delete a service (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, serviceController.deleteService);

module.exports = router;