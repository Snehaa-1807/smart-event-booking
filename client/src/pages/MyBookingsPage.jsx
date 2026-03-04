import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Ticket, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../utils/api';
import { GlassButton, LoadingSpinner, EmptyState, Badge } from '../components/ui/index.jsx';
import { Link } from 'react-router-dom';

export default function MyBookingsPage() {
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = async (e) => {
    if (e) e.preventDefault();
    if (!searchEmail) return;
    setLoading(true);
    try {
      const res = await bookingsAPI.getAll({ email: searchEmail });
      setBookings(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    setCancelling(id);
    try {
      await bookingsAPI.cancel(id);
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'cancelled' } : bk));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080f] pt-28 pb-24">
      <div className="fixed inset-0 mesh-bg opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <span className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-3 block">My Account</span>
          <h1 className="text-5xl font-black font-display text-white mb-4">
            My <span className="gradient-text">Tickets</span>
          </h1>
          <p className="text-gray-400">Enter your email to view your bookings</p>
        </motion.div>

        {/* Email search */}
        <form onSubmit={fetchBookings} className="glass rounded-2xl p-4 mb-10 flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Enter your email address..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <GlassButton type="submit" disabled={!searchEmail || loading}>
            {loading ? 'Searching...' : 'Find Bookings'}
          </GlassButton>
        </form>

        {/* Bookings list */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : bookings.length === 0 && searchEmail ? (
            <EmptyState
              title="No bookings found"
              description="No bookings found for this email address."
              action={<Link to="/events"><GlassButton>Browse Events</GlassButton></Link>}
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-3xl overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-32 h-32 md:h-auto flex-shrink-0">
                      <img
                        src={booking.img || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'}
                        alt={booking.event_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-white font-display">{booking.event_title}</h3>
                            <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-indigo-400" />
                              {new Date(booking.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-pink-400" />
                              {booking.event_location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Ticket size={13} className="text-teal-400" />
                              {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black gradient-text font-display">₹{parseFloat(booking.total_amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Booking #{booking.id}</p>
                        </div>
                      </div>

                      {booking.status === 'confirmed' && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (confirm('Cancel this booking?')) cancelBooking(booking.id);
                            }}
                            disabled={cancelling === booking.id}
                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            <X size={14} />
                            {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
