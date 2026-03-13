const Razorpay = require('razorpay');
const crypto = require('crypto');
const BookingModel = require('../models/bookingModel');
const EventModel = require('../models/eventModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { event_id, quantity } = req.body;

    const event = await EventModel.findById(event_id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.available_seats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${event.available_seats} seats available` });
    }

    const amount = Math.round(event.price * quantity * 100); // Razorpay needs integer paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { event_id, quantity },
    });

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        event_title: event.title,
      },
    });
  } catch (err) {
    console.error('❌ Razorpay order error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// Step 2: Verify payment + create booking
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      event_id, name, email, mobile, quantity,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Payment verified — now create booking
    const event = await EventModel.findById(event_id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const seatsDecreased = await EventModel.decreaseSeats(event_id, quantity);
    if (!seatsDecreased) {
      return res.status(400).json({ success: false, message: 'Could not reserve seats' });
    }

    const total_amount = event.price * quantity;
    const bookingId = await BookingModel.create({
      event_id, name, email, mobile, quantity, total_amount,
      payment_id: razorpay_payment_id,
      payment_status: 'paid',
    });

    const booking = await BookingModel.findById(bookingId);
    const updatedEvent = await EventModel.findById(event_id);

    req.io?.emit('seats:updated', { event_id, available_seats: updatedEvent.available_seats });
    req.io?.emit('booking:created', booking);

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('❌ Payment verify error:', err);
    res.status(500).json({ success: false, message: 'Booking creation failed after payment' });
  }
};

module.exports = { createOrder, verifyPayment };