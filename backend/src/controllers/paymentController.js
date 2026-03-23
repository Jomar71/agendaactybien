const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

const paymentController = {
  // Get all payments
  getAllPayments: async (req, res) => {
    try {
      const payments = await Payment.findAll();
      res.json(payments);
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get payments by appointment ID
  getPaymentsByAppointmentId: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const payments = await Payment.findByAppointmentId(appointmentId);
      
      res.json(payments);
    } catch (error) {
      console.error('Error getting payments by appointment ID:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new payment
  createPayment: async (req, res) => {
    try {
      const { appointmentId, monto, metodo, comprobante } = req.body;
      
      // Validate required fields
      if (!appointmentId || !monto || !metodo) {
        return res.status(400).json({ message: 'Appointment ID, amount, and method are required' });
      }

      // Verify appointment exists
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const newPayment = await Payment.create(appointmentId, monto, metodo, comprobante);
      
      // Update appointment payment status to pending
      await Appointment.updatePaymentStatus(appointmentId, 'pendiente');
      
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const payment = await Payment.updateStatus(id, estado);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Update appointment payment status based on payment status
      const appointmentPayments = await Payment.findByAppointmentId(payment.appointment_id);
      let appointmentPaymentStatus = 'confirmado'; // Default to confirmed if all payments are confirmed
      
      for (const p of appointmentPayments) {
        if (p.estado === 'rechazado') {
          appointmentPaymentStatus = 'rechazado';
          break;
        } else if (p.estado === 'pendiente') {
          appointmentPaymentStatus = 'pendiente';
        }
      }
      
      await Appointment.updatePaymentStatus(payment.appointment_id, appointmentPaymentStatus);
      
      res.json(payment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete a payment
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await Payment.delete(id);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = paymentController;