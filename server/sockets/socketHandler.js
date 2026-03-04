const lockedSeats = {}; // { event_id: { socketId: { quantity, timer } } }

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Temporary seat lock
    socket.on('seats:lock', ({ event_id, quantity }) => {
      if (!lockedSeats[event_id]) lockedSeats[event_id] = {};

      // Release old lock from same socket
      if (lockedSeats[event_id][socket.id]) {
        clearTimeout(lockedSeats[event_id][socket.id].timer);
      }

      const timer = setTimeout(() => {
        delete lockedSeats[event_id]?.[socket.id];
        io.emit('seats:lock_released', { event_id, socket_id: socket.id });
      }, 10 * 60 * 1000); // 10 min lock

      lockedSeats[event_id][socket.id] = { quantity, timer };

      const totalLocked = Object.values(lockedSeats[event_id])
        .reduce((sum, v) => sum + v.quantity, 0);

      io.emit('seats:locked', { event_id, total_locked: totalLocked });
    });

    socket.on('seats:unlock', ({ event_id }) => {
      if (lockedSeats[event_id]?.[socket.id]) {
        clearTimeout(lockedSeats[event_id][socket.id].timer);
        delete lockedSeats[event_id][socket.id];

        const totalLocked = Object.values(lockedSeats[event_id] || {})
          .reduce((sum, v) => sum + v.quantity, 0);
        io.emit('seats:lock_released', { event_id, total_locked: totalLocked });
      }
    });

    socket.on('disconnect', () => {
      Object.keys(lockedSeats).forEach(event_id => {
        if (lockedSeats[event_id]?.[socket.id]) {
          clearTimeout(lockedSeats[event_id][socket.id].timer);
          delete lockedSeats[event_id][socket.id];
        }
      });
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSockets;
