import { create } from 'zustand';

export const useEventStore = create((set) => ({
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  filters: { search: '', location: '', sortBy: 'date' },

  setEvents: (events) => set({ events }),
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),

  updateEventSeats: (event_id, available_seats) => set(state => ({
    events: state.events.map(e =>
      e.id === parseInt(event_id) ? { ...e, available_seats } : e
    ),
    currentEvent: state.currentEvent?.id === parseInt(event_id)
      ? { ...state.currentEvent, available_seats }
      : state.currentEvent,
  })),
}));

export const useBookingStore = create((set) => ({
  bookings: [],
  currentBooking: null,
  stats: null,
  loading: false,
  setBookings: (bookings) => set({ bookings }),
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
}));
