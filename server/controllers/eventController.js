const EventModel = require('../models/eventModel');

const getEvents = async (req, res, next) => {
  try {
    const { search, location, minPrice, maxPrice, sortBy } = req.query;
    const events = await EventModel.findAll({ search, location, minPrice, maxPrice, sortBy });
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

const createEvent = async (req, res, next) => {
  try {
    const id = await EventModel.create(req.body);
    const event = await EventModel.findById(id);
    // Broadcast new event via socket
    req.io?.emit('event:created', event);
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await EventModel.update(req.params.id, req.body);
    const updated = await EventModel.findById(req.params.id);
    req.io?.emit('event:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await EventModel.delete(req.params.id);
    req.io?.emit('event:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
