const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all payments (admin only)
router.get('/', authenticateToken, authorizeAdmin, paymentController.getAllPayments);

// Get payment by ID (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, paymentController.getPaymentById);

// Get payments by appointment ID (admin only)
router.get('/appointment/:appointmentId', authenticateToken, authorizeAdmin, paymentController.getPaymentsByAppointmentId);

// Create a new payment (admin only)
router.post('/', authenticateToken, authorizeAdmin, [
  body('appointmentId').isInt().withMessage('Appointment ID must be an integer'),
  body('monto').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('metodo').isIn(['nequi', 'transferencia']).withMessage('Invalid payment method')
], paymentController.createPayment);

// Update payment status (admin only)
router.patch('/:id/status', authenticateToken, authorizeAdmin, [
  body('estado').isIn(['pendiente', 'confirmado', 'rechazado']).withMessage('Invalid status')
], paymentController.updatePaymentStatus);

// Delete a payment (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, paymentController.deletePayment);

module.exports = router;