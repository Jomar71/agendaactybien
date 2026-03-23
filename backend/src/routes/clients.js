const express = require('express');
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all clients (admin only)
router.get('/', authenticateToken, authorizeAdmin, clientController.getAllClients);

// Get client by ID (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, clientController.getClientById);

// Create a new client (admin only)
router.post('/', authenticateToken, authorizeAdmin, [
  body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('telefono').trim().notEmpty().withMessage('Teléfono is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], clientController.createClient);

// Update a client (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, [
  body('nombre').optional().trim().isLength({ min: 2 }).withMessage('Nombre must be at least 2 characters'),
  body('telefono').optional().trim().notEmpty().withMessage('Teléfono is required'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], clientController.updateClient);

// Delete a client (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, clientController.deleteClient);

module.exports = router;