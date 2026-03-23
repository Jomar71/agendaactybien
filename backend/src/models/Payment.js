const pool = require('../config/db');

const Payment = {
  // Find all payments
  findAll: async () => {
    const result = await pool.query(`
      SELECT p.*, a.fecha AS appointment_date, c.nombre AS client_name, s.nombre AS service_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  },

  // Find payment by ID
  findById: async (id) => {
    const result = await pool.query(`
      SELECT p.*, a.fecha AS appointment_date, c.nombre AS client_name, s.nombre AS service_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE p.id = $1
    `);
    return result.rows[0];
  },

  // Find payments by appointment ID
  findByAppointmentId: async (appointmentId) => {
    const result = await pool.query('SELECT * FROM payments WHERE appointment_id = $1 ORDER BY created_at DESC', [appointmentId]);
    return result.rows;
  },

  // Create a new payment
  create: async (appointmentId, monto, metodo, comprobante = null) => {
    const result = await pool.query(
      'INSERT INTO payments (appointment_id, monto, metodo, comprobante, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [appointmentId, monto, metodo, comprobante, 'pendiente']
    );
    return result.rows[0];
  },

  // Update payment status
  updateStatus: async (id, estado) => {
    const result = await pool.query(
      'UPDATE payments SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    return result.rows[0];
  },

  // Delete a payment
  delete: async (id) => {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Payment;