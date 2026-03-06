import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://booking-flow.onrender.com';

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling'], // fallback to polling if websocket blocked
});

export default socket;