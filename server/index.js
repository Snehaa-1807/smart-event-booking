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
const paymentRoutes = require('./routes/paymentRoutes');
const { errorHandler } = require('./middleware/validation');
const setupSockets = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://smart-event-booking-umber.vercel.app',
  'https://smart-event-booking-ewv9.vercel.app',
  'https://eventspheress.netlify.app',
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST','PUT','PATCH','DELETE'] }
});

app.use(cors({ origin: allowedOrigins, methods: ['GET','POST','PUT','PATCH','DELETE'] }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => res.json({ status: 'EventSphere API running ✅' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(errorHandler);
setupSockets(io);

const PORT = process.env.PORT || 5000;
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});