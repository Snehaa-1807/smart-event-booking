const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { errorHandler } = require('./middleware/validation');
const setupSockets = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }
});

// ── Middleware ──
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// ── Serve uploaded images as static files ──
// Accessible at: http://localhost:5000/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Attach socket.io to every request ──
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ──
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);

// Test route — hit this in browser to verify DB is working
app.get('/api/test-booking', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const [events] = await pool.query('SELECT id, title, available_seats FROM events LIMIT 3');
    const [bookings] = await pool.query('SELECT COUNT(*) as count FROM bookings');
    res.json({ 
      status: 'DB connected ',
      events,
      total_bookings: bookings[0].count
    });
  } catch (err) {
    res.status(500).json({ status: 'DB error ', error: err.message });
  }
});

// ── Error handler ──
app.use(errorHandler);

// ── Socket.IO ──
setupSockets(io);

// ── Start ──
const PORT = process.env.PORT || 5000;
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
    console.log(` Uploads served at http://localhost:${PORT}/uploads`);
  });
});