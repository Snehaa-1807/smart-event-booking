import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Zap } from 'lucide-react';

export function EventCard({ event, index = 0 }) {
  const soldPercent = Math.round(((event.total_seats - event.available_seats) / event.total_seats) * 100);
  const isAlmostFull = event.available_seats < 50;
  const isSoldOut = event.available_seats === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group glass rounded-3xl overflow-hidden cursor-pointer"
    >
      <Link to={`/events/${event.id}`} className="block">
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={event.img || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Tags */}
          <div className="absolute top-4 left-4 flex gap-2">
            {isSoldOut ? (
              <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                Sold Out
              </span>
            ) : isAlmostFull ? (
              <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                Almost Full
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                Available
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="glass-dark rounded-xl px-3 py-1.5">
                <span className="text-xs text-gray-400">From</span>
                <p className="text-white font-bold text-lg leading-none">
                  ₹{parseFloat(event.price).toLocaleString()}
                </p>
              </div>
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 border-2 border-black/50" />
                ))}
                <div className="w-7 h-7 rounded-full glass border-2 border-white/10 flex items-center justify-center text-xs text-white">
                  +{Math.max(0, event.available_seats - 3)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors duration-200 font-display">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar size={14} className="text-indigo-400 flex-shrink-0" />
              {new Date(event.date).toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={14} className="text-pink-400 flex-shrink-0" />
              {event.location}
            </div>
          </div>

          {/* Seats bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <Users size={11} />
                {event.available_seats} seats left
              </span>
              <span>{soldPercent}% filled</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${soldPercent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  soldPercent > 90 ? 'bg-red-500' : soldPercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center text-indigo-400 text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-200">
            View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="h-56 skeleton" />
      <div className="p-6 space-y-3">
        <div className="h-5 skeleton rounded-lg w-3/4" />
        <div className="h-4 skeleton rounded-lg w-1/2" />
        <div className="h-4 skeleton rounded-lg w-2/3" />
        <div className="h-1.5 skeleton rounded-full" />
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/8 text-gray-300',
    success: 'bg-green-500/15 text-green-400 border border-green-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
    primary: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function StatCounter({ value, label, prefix = '', suffix = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="text-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-5xl font-bold font-display gradient-text mb-2"
      >
        {prefix}
        <AnimatedNumber value={value} />
        {suffix}
      </motion.div>
      <p className="text-gray-400 text-sm">{label}</p>
    </motion.div>
  );
}

function AnimatedNumber({ value }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {value}
    </motion.span>
  );
}

export function GlassButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
    secondary: 'glass text-white hover:bg-white/8',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/20',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} relative`}>
      <div className={`${sizes[size]} rounded-full border-2 border-white/10`} />
      <div className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-transparent border-t-indigo-500 animate-spin`} />
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="w-16 h-16 mx-auto mb-6 glass rounded-2xl flex items-center justify-center">
        <Zap size={28} className="text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold font-display text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </motion.div>
  );
}
