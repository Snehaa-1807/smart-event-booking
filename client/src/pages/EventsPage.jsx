import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, X, ChevronDown, SlidersHorizontal, Calendar } from 'lucide-react';
import { eventsAPI } from '../utils/api';
import socket from '../utils/socket';
import { useEventStore } from '../store/index.js';
import { Link } from 'react-router-dom';
import { resolveImage, FALLBACK } from '../utils/imageHelper';

const cities = ['All Cities','Bangalore','Mumbai','Delhi','Goa','Hyderabad','Rishikesh','Chennai','Kolkata'];
const sorts = [
  { value: 'date',       label: 'Earliest Date' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'seats',      label: 'Most Available' },
];
const categories = [
  { label: 'All',      keyword: '' },
  { label: 'Tech',     keyword: 'tech' },
  { label: 'Music',    keyword: 'music' },
  { label: 'Design',   keyword: 'design' },
  { label: 'Startup',  keyword: 'startup' },
  { label: 'Wellness', keyword: 'wellness' },
  { label: 'Food',     keyword: 'food' },
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-52 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 skeleton rounded-lg w-3/4" />
        <div className="h-3 skeleton rounded-lg w-1/2" />
        <div className="h-3 skeleton rounded-lg w-2/3" />
        <div className="h-1.5 skeleton rounded-full mt-4" />
      </div>
    </div>
  );
}

function EventCard({ event, index }) {
  const soldPct = Math.round(((event.total_seats - event.available_seats) / event.total_seats) * 100);
  const isFull = event.available_seats === 0;
  const isLow  = event.available_seats > 0 && event.available_seats < 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -7, transition: { duration: 0.3 } }}
      className="rounded-2xl overflow-hidden group cursor-pointer"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Link to={`/events/${event.id}`} className="block">
        <div className="relative h-52 overflow-hidden">
          <img
            src={resolveImage(event.img)}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={e => { e.target.onerror = null; e.target.src = FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute top-3 left-3">
            {isFull ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}>Sold Out</span>
            ) : isLow ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(245,200,66,0.9)', color: '#0a0a0a' }}>Almost Full</span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.85)', color: 'white' }}>Available</span>
            )}
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <span className="text-2xl font-black text-white font-urban">₹{parseFloat(event.price).toLocaleString()}</span>
            <span className="text-xs text-white/50">{event.available_seats} seats left</span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-bold text-white font-urban text-[0.95rem] mb-2 line-clamp-1 group-hover:text-[#f5c842] transition-colors">{event.title}</h3>
          <div className="flex items-center gap-1.5 text-xs text-white/35 mb-1">
            <Calendar size={11} color="#7c3aed" />
            {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/35 mb-4">
            <MapPin size={11} color="#f5c842" />
            {event.location}
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-white/20 mb-1.5">
              <span>{event.available_seats} available</span>
              <span>{soldPct}% filled</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${soldPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: soldPct > 85 ? '#ef4444' : soldPct > 65 ? '#f5c842' : '#7c3aed' }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsPage() {
  const { events, setEvents, updateEventSeats } = useEventStore();
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [location, setLocation]             = useState('');
  const [sortBy, setSortBy]                 = useState('date');
  const [activeCategory, setActiveCategory] = useState('All');

  const headerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: headerRef, offset: ['start start', 'end start'] });
  const headerY       = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // ── Single effect — runs whenever search/location/sortBy change ──
  // Uses a ref to hold latest values so the fetch always sees fresh state
  const filtersRef = useRef({ search, location, sortBy });
  filtersRef.current = { search, location, sortBy };

  useEffect(() => {
    const delay = search ? 400 : 0; // debounce only search typing
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { search: s, location: l, sortBy: sb } = filtersRef.current;
        const params = {};
        if (s)            params.search   = s;
        if (l)            params.location = l;
        if (sb !== 'date') params.sortBy  = sb;
        const res = await eventsAPI.getAll(params);
        setEvents(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, delay);
    return () => clearTimeout(t);
  }, [search, location, sortBy]);

  useEffect(() => {
    socket.on('seats:updated', ({ event_id, available_seats }) => updateEventSeats(event_id, available_seats));
    return () => socket.off('seats:updated');
  }, [updateEventSeats]);

  function handleCategoryClick(cat) {
    setActiveCategory(cat.label);
    setSearch(cat.keyword);
    // Location stays, sort stays — only search keyword changes
  }

  function handleSearchChange(val) {
    setSearch(val);
    setActiveCategory('All'); // reset pill if user types manually
  }

  function clearAll() {
    setSearch('');
    setLocation('');
    setSortBy('date');
    setActiveCategory('All');
  }

  const hasFilters = search || location || sortBy !== 'date';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Parallax header */}
      <div ref={headerRef} className="relative h-52 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #6d28d9 100%)' }}>
        <motion.div style={{ y: headerY, opacity: headerOpacity }}
          className="absolute inset-0 flex flex-col justify-end px-6 lg:px-10 pb-10 max-w-7xl mx-auto w-full left-0 right-0">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 1200 208" fill="none">
              <ellipse cx="600" cy="100" rx="580" ry="90" stroke="white" strokeWidth="1" fill="none"/>
              <ellipse cx="600" cy="100" rx="400" ry="60" stroke="white" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2 font-urban">Discover</p>
          <h1 className="text-4xl md:text-5xl font-black text-white font-urban">
            Upcoming <span style={{ color: '#f5c842' }}>Events</span>
          </h1>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {/* Filter bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full rounded-xl pl-11 pr-10 py-3 text-white text-sm outline-none placeholder-white/20"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
            {search && (
              <button onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
            <select
              value={location || 'All Cities'}
              onChange={e => setLocation(e.target.value === 'All Cities' ? '' : e.target.value)}
              className="appearance-none rounded-xl pl-10 pr-9 py-3 text-white text-sm outline-none min-w-[150px] cursor-pointer"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', color: location ? 'white' : 'rgba(255,255,255,0.4)' }}
            >
              {cities.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
          </div>

          {/* Sort */}
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none rounded-xl pl-10 pr-9 py-3 text-white text-sm outline-none min-w-[170px] cursor-pointer"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', color: 'white' }}
            >
              {sorts.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
          </div>

          {hasFilters && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white transition-colors whitespace-nowrap"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <X size={13} /> Clear all
            </button>
          )}
        </motion.div>

        {/* Category pills */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat.label}
              onClick={() => handleCategoryClick(cat)}
              className={`cat-pill ${activeCategory === cat.label ? 'active' : ''}`}>
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-white/20 self-center">
            {loading ? 'Searching...' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
          </span>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Search size={24} color="#7c3aed" />
              </div>
              <h3 className="text-xl font-black text-white font-urban mb-2">No events found</h3>
              <p className="text-white/30 text-sm mb-6">Try a different search or clear the filters</p>
              <button onClick={clearAll}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: '#7c3aed' }}>
                <X size={14} /> Clear Filters
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}