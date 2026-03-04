const { pool } = require('../config/db');

const BookingModel = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT b.*, e.title as event_title, e.date as event_date, e.location as event_location
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      ORDER BY b.booking_date DESC
    `);
    return rows;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(`
      SELECT b.*, e.title as event_title, e.date as event_date, e.location as event_location, e.img
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.email = ?
      ORDER BY b.booking_date DESC
    `, [email]);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT b.*, e.title as event_title, e.date as event_date, e.location as event_location, e.img
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.id = ?
    `, [id]);
    return rows[0];
  },

  async create({ event_id, name, email, mobile, quantity, total_amount }) {
    const [result] = await pool.query(
      'INSERT INTO bookings (event_id, name, email, mobile, quantity, total_amount) VALUES (?,?,?,?,?,?)',
      [event_id, name, email, mobile, quantity, total_amount]
    );
    return result.insertId;
  },

  async cancel(id) {
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
  },

  async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_amount) as total_revenue,
        SUM(quantity) as total_tickets
      FROM bookings WHERE status = 'confirmed'
    `);
    return stats[0];
  }
};

module.exports = BookingModel;
