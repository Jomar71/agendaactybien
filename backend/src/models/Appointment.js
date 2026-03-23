const pool = require('../config/db');

const Appointment = {
  // Find all appointments
  findAll: async () => {
    const result = await pool.query(`
      SELECT a.*, c.nombre AS client_name, s.nombre AS service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.fecha DESC, a.hora ASC
    `);
    return result.rows;
  },

  // Find appointment by ID
  findById: async (id) => {
    const result = await pool.query(`
      SELECT a.*, c.nombre AS client_name, s.nombre AS service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = $1
    `);
    return result.rows[0];
  },

  // Find appointments by date
  findByDate: async (date) => {
    const result = await pool.query(`
      SELECT a.*, c.nombre AS client_name, s.nombre AS service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.fecha = $1
      ORDER BY a.hora ASC
    `, [date]);
    return result.rows;
  },

  // Find appointments by date range
  findByDateRange: async (startDate, endDate) => {
    const result = await pool.query(`
      SELECT a.*, c.nombre AS client_name, s.nombre AS service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.fecha BETWEEN $1 AND $2
      ORDER BY a.fecha ASC, a.hora ASC
    `, [startDate, endDate]);
    return result.rows;
  },

  // Find appointments by client ID
  findByClientId: async (clientId) => {
    const result = await pool.query(`
      SELECT a.*, c.nombre AS client_name, s.nombre AS service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.client_id = $1
      ORDER BY a.fecha DESC, a.hora ASC
    `, [clientId]);
    return result.rows;
  },

  // Create a new appointment
  create: async (clientId, serviceId, fecha, hora, metodoPago, abonoMonto, comprobanteUrl = null) => {
    const result = await pool.query(
      'INSERT INTO appointments (client_id, service_id, fecha, hora, metodo_pago, abono_monto, comprobante_url, estado, pago_estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [clientId, serviceId, fecha, hora, metodoPago, abonoMonto, comprobanteUrl, 'pendiente', 'pendiente']
    );
    return result.rows[0];
  },

  // Update appointment status
  updateStatus: async (id, estado) => {
    const result = await pool.query(
      'UPDATE appointments SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    return result.rows[0];
  },

  // Update payment status
  updatePaymentStatus: async (id, pagoEstado) => {
    const result = await pool.query(
      'UPDATE appointments SET pago_estado = $1 WHERE id = $2 RETURNING *',
      [pagoEstado, id]
    );
    return result.rows[0];
  },

  // Update appointment with proof of payment
  updateWithProof: async (id, comprobanteUrl) => {
    const result = await pool.query(
      'UPDATE appointments SET comprobante_url = $1, pago_estado = $2 WHERE id = $3 RETURNING *',
      [comprobanteUrl, 'pendiente', id]
    );
    return result.rows[0];
  },

  // Delete an appointment
  delete: async (id) => {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Appointment;