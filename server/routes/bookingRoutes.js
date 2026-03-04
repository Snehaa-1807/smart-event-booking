const express = require('express');
const router = express.Router();
const { getBookings, createBooking, cancelBooking, getStats } = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validation');

router.get('/', getBookings);
router.get('/stats', getStats);
router.post('/', validateBooking, createBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
