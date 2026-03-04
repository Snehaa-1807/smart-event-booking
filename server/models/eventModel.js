const { pool } = require('../config/db');

const EventModel = {
  async findAll({ search, location, minPrice, maxPrice, sortBy } = {}) {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    const orderMap = {
      date: 'date ASC',
      price_asc: 'price ASC',
      price_desc: 'price DESC',
      seats: 'available_seats DESC',
    };
    query += ` ORDER BY ${orderMap[sortBy] || 'date ASC'}`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { title, description, location, date, total_seats, available_seats, price, img } = data;
    const [result] = await pool.query(
      'INSERT INTO events (title, description, location, date, total_seats, available_seats, price, img) VALUES (?,?,?,?,?,?,?,?)',
      [title, description, location, date, total_seats, available_seats || total_seats, price, img]
    );
    return result.insertId;
  },

  async update(id, data) {
    // Only update known columns — prevents SQL errors from extra fields
    const allowed = ['title', 'description', 'location', 'date', 'total_seats', 'available_seats', 'price', 'img'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key] === '' ? null : data[key]);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  },

  async decreaseSeats(id, quantity, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'UPDATE events SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?',
      [quantity, id, quantity]
    );
    return result.affectedRows > 0;
  },

  async increaseSeats(id, quantity) {
    await pool.query('UPDATE events SET available_seats = available_seats + ? WHERE id = ?', [quantity, id]);
  }
};

module.exports = EventModel;