const BookingModel = require('../models/bookingModel');
const EventModel = require('../models/eventModel');

const getBookings = async (req, res, next) => {
  try {
    const { email } = req.query;
    const bookings = email
      ? await BookingModel.findByEmail(email)
      : await BookingModel.findAll();
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};

const createBooking = async (req, res, next) => {
  try {
    console.log('📥 Booking request body:', req.body);

    const { event_id, name, email, mobile, quantity } = req.body;

    const event = await EventModel.findById(event_id);
    console.log('🎫 Event found:', event ? `${event.title} (${event.available_seats} seats)` : 'NOT FOUND');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.available_seats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${event.available_seats} seats available` });
    }

    const seatsDecreased = await EventModel.decreaseSeats(event_id, quantity);
    console.log('💺 Seats decreased:', seatsDecreased);

    if (!seatsDecreased) {
      return res.status(400).json({ success: false, message: 'Could not reserve seats — please try again' });
    }

    const total_amount = event.price * quantity;
    console.log('💰 Total amount:', total_amount);

    const bookingId = await BookingModel.create({ event_id, name, email, mobile, quantity, total_amount });
    console.log('✅ Booking created with ID:', bookingId);

    const booking = await BookingModel.findById(bookingId);
    const updatedEvent = await EventModel.findById(event_id);

    req.io?.emit('seats:updated', { event_id, available_seats: updatedEvent.available_seats });
    req.io?.emit('booking:created', booking);

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('❌ Booking error:', err.message, err.stack);
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    await BookingModel.cancel(req.params.id);
    await EventModel.increaseSeats(booking.event_id, booking.quantity);

    const updatedEvent = await EventModel.findById(booking.event_id);
    req.io?.emit('seats:updated', {
      event_id: booking.event_id,
      available_seats: updatedEvent.available_seats
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await BookingModel.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = { getBookings, createBooking, cancelBooking, getStats };