const validateEvent = (req, res, next) => {
  const { title, date, total_seats, price } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (!date) errors.push('Event date is required');
  if (!total_seats || isNaN(total_seats) || total_seats < 1) errors.push('Total seats must be a positive number');
  if (price === undefined || isNaN(price) || price < 0) errors.push('Price must be a non-negative number');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const validateBooking = (req, res, next) => {
  const { event_id, name, email, mobile, quantity } = req.body;
  const errors = [];
  const qty = parseInt(quantity);

  if (!event_id) errors.push('Event ID is required');
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!mobile || !/^\d{10}$/.test(mobile.replace(/\s/g, ''))) errors.push('Valid 10-digit mobile number required');
  if (!quantity || isNaN(qty) || qty < 1) errors.push('Quantity must be at least 1');
  if (qty > 10) errors.push('Maximum 10 tickets per booking');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  // Normalize quantity to integer
  req.body.quantity = qty;
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = { validateEvent, validateBooking, errorHandler };