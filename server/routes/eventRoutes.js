const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { validateEvent } = require('../middleware/validation');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', validateEvent, createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
