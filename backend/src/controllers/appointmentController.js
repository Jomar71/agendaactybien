const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Service = require('../models/Service');
const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Configure email transporter for demo with Ethereal
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const appointmentController = {
  // Get all appointments
  getAllAppointments: async (req, res) => {
    try {
      const appointments = await Appointment.findAll();
      res.json(appointments);
    } catch (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get appointment by ID
  getAppointmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error getting appointment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new appointment
  createAppointment: async (req, res) => {
    try {
      const { clientId, serviceId, fecha, hora, metodoPago, abonoMonto } = req.body;
      
      // Validate required fields
      if (!clientId || !serviceId || !fecha || !hora || !metodoPago || !abonoMonto) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if appointment slot is available
      const existingAppointment = await pool.query(
        'SELECT id FROM appointments WHERE fecha = $1 AND hora = $2 AND estado != $3',
        [fecha, hora, 'cancelada']
      );
      
      if (existingAppointment.rows.length > 0) {
        return res.status(400).json({ message: 'Time slot is already booked' });
      }

      // Create the appointment
      const newAppointment = await Appointment.create(clientId, serviceId, fecha, hora, metodoPago, abonoMonto);

      // Get client and service details for email notification
      const client = await Client.findById(clientId);
      const service = await Service.findById(serviceId);

      // Send confirmation email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: 'Confirmación de Cita - NailArt Studio',
        html: `
          <h2>Confirmación de Cita</h2>
          <p>Hola <strong>${client.nombre}</strong>,</p>
          <p>Su cita ha sido agendada con éxito. A continuación los detalles:</p>
          
          <ul>
            <li><strong>Servicio:</strong> ${service.nombre}</li>
            <li><strong>Fecha:</strong> ${fecha}</li>
            <li><strong>Hora:</strong> ${hora}</li>
            <li><strong>Método de Pago:</strong> ${metodoPago}</li>
            <li><strong>Abono:</strong> $${abonoMonto.toLocaleString()}</li>
          </ul>
          
          <p>Por favor realice el pago del abono del 30% para confirmar su cita.</p>
          
          <h3>Datos de Pago</h3>
          <p><strong>Nequi:</strong> ${process.env.NEQUI_NUMBER}</p>
          <p><strong>Cuenta de Ahorros Bancolombia:</strong> ${process.env.BANCOLOMBIA_ACCOUNT}</p>
          <p><strong>Banco:</strong> ${process.env.BANK_NAME}</p>
          <p><strong>A nombre de:</strong> ${process.env.ACCOUNT_HOLDER}</p>
          
          <p>Gracias por confiar en <strong>NailArt Studio</strong>.</p>
        `
      };

      // Send email (in production, you'd handle this differently)
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error sending email:', err);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.status(201).json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const appointment = await Appointment.updateStatus(id, estado);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { pagoEstado } = req.body;
      
      const appointment = await Appointment.updatePaymentStatus(id, pagoEstado);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Upload proof of payment
  uploadProofOfPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { comprobanteUrl } = req.body;
      
      if (!comprobanteUrl) {
        return res.status(400).json({ message: 'Comprobante URL is required' });
      }
      
      const appointment = await Appointment.updateWithProof(id, comprobanteUrl);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error uploading proof of payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get appointments by date
  getAppointmentsByDate: async (req, res) => {
    try {
      const { date } = req.params;
      const appointments = await Appointment.findByDate(date);
      res.json(appointments);
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get appointments by date range
  getAppointmentsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const appointments = await Appointment.findByDateRange(startDate, endDate);
      res.json(appointments);
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete an appointment
  deleteAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.delete(id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = appointmentController;