const express = require('express');
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all appointments (admin only)
router.get('/', authenticateToken, authorizeAdmin, appointmentController.getAllAppointments);

// Get appointment by ID (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, appointmentController.getAppointmentById);

// Create a new appointment (public)
router.post('/', [
  body('clientId').isInt().withMessage('Client ID must be an integer'),
  body('serviceId').isInt().withMessage('Service ID must be an integer'),
  body('fecha').isISO8601().withMessage('Fecha must be a valid date'),
  body('hora').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora must be in HH:MM format'),
  body('metodoPago').isIn(['nequi', 'transferencia']).withMessage('Método de pago inválido'),
  body('abonoMonto').isFloat({ min: 0 }).withMessage('Abono must be a positive number')
], appointmentController.createAppointment);

// Update appointment status (admin only)
router.patch('/:id/status', authenticateToken, authorizeAdmin, [
  body('estado').isIn(['pendiente', 'confirmada', 'cancelada']).withMessage('Estado inválido')
], appointmentController.updateAppointmentStatus);

// Get appointments by date (admin only)
router.get('/date/:date', authenticateToken, authorizeAdmin, appointmentController.getAppointmentsByDate);

// Get appointments by date range (admin only)
router.get('/date-range', authenticateToken, authorizeAdmin, appointmentController.getAppointmentsByDateRange);

// Delete an appointment (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, appointmentController.deleteAppointment);

module.exports = router;