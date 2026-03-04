import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Star, Plus, Minus, ArrowRight, Calendar, Users } from 'lucide-react';
import { eventsAPI } from '../utils/api';
import { resolveImage, FALLBACK } from '../utils/imageHelper';

/* ─── Animated counter ─── */
function useCountUp(end, trigger) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let n = 0; const step = end / 60;
    const t = setInterval(() => { n += step; if (n >= end) { setV(end); clearInterval(t); } else setV(Math.floor(n)); }, 20);
    return () => clearInterval(t);
  }, [end, trigger]);
  return v;
}
function Counter({ end, suffix = '', label }) {
  const ref = useRef(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGo(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const v = useCountUp(end, go);
  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-black font-urban mb-1" style={{ color: '#f5c842' }}>
        {v.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-white/40 font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* ─── FAQ item ─── */
function Faq({ q, a, i }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.08]">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group">
        <span className={`text-base font-semibold font-urban transition-colors ${open ? 'text-[#f5c842]' : 'text-white group-hover:text-[#f5c842]'}`}>{q}</span>
        <span className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${open ? 'bg-[#7c3aed] border-[#7c3aed] text-white' : 'border-white/20 text-white/40'}`}>
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="pb-5 text-sm text-white/40 leading-relaxed pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Speaker card — exactly like Summitra (tall portrait, coloured bg) ─── */
const speakerBgs = ['#F5A623', '#4A90E2', '#D25BB0', '#E8674A', '#50B87C'];
function SpeakerCard({ speaker, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: speakerBgs[index % speakerBgs.length], aspectRatio: '3/4' }}
    >
      <img
        src={speaker.img}
        alt={speaker.name}
        className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
        style={{ mixBlendMode: 'multiply' }}
      />
      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-bold text-white font-urban leading-tight mb-0.5">{speaker.name}</h3>
        <p className="text-sm text-white/60">{speaker.role}</p>
      </div>
    </motion.div>
  );
}

/* ─── Event card ─── */
function EventCard({ event, index }) {
  const navigate = useNavigate();
  const sold = Math.round(((event.total_seats - event.available_seats) / event.total_seats) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/events/${event.id}`)}
      className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="relative h-52 overflow-hidden">
        <img src={resolveImage(event.img)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={e => { e.target.onerror=null; e.target.src=FALLBACK; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="text-2xl font-black text-white font-urban">₹{parseFloat(event.price).toLocaleString()}</span>
        </div>
        <div className="absolute top-3 right-3 bg-[#7c3aed] rounded-full px-3 py-1 text-xs font-bold text-white">
          {event.available_seats > 0 ? `${event.available_seats} left` : 'Sold Out'}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white font-urban mb-2 line-clamp-1 group-hover:text-[#f5c842] transition-colors">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
          <Calendar size={11} className="text-[#7c3aed]" />
          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
          <MapPin size={11} className="text-[#7c3aed]" />
          {event.location}
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${sold}%` }}
            viewport={{ once: true }} transition={{ duration: 1 }}
            className="h-full rounded-full" style={{ background: sold > 80 ? '#ef4444' : '#7c3aed' }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ════════ MAIN ════════ */
export default function LandingPage() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  // ── Parallax ──
  const { scrollY } = useScroll();
  const heroBgY     = useTransform(scrollY, [0, 800],  [0, 200]);
  const heroTextY   = useTransform(scrollY, [0, 600],  [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 400],  [1, 0.3]);
  const floatOrb1Y  = useTransform(scrollY, [0, 1000], [0, -150]);
  const floatOrb2Y  = useTransform(scrollY, [0, 1000], [0, 100]);
  const speakerBgY  = useTransform(scrollY, [400, 1200],[0, 80]);
  const aboutBgY    = useTransform(scrollY, [800, 1600],[0, 100]);

  // Countdown
  const target = new Date('2025-08-13T09:00:00');
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - new Date());
      setCd({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    eventsAPI.getAll().then(r => setEvents(r.data?.slice(0, 3) || [])).catch(() => {});
  }, []);

  const speakers = [
    { name: 'Dr. Marcus Elwood', role: 'AI Scientist, NeuroCore Labs', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&crop=faces' },
    { name: 'Jonathan Reyes', role: 'Head of Cloud Engineering', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop&crop=faces' },
    { name: 'Daniel Kim', role: 'Founder & CTO, DevSync', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&crop=faces' },
    { name: 'Ahmed Faizal', role: 'Lead Cybersecurity Architect', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&crop=faces' },
  ];

  const faqs = [
    { q: 'Will the talks be recorded?', a: 'Yes — all keynote and breakout sessions are recorded and shared with ticket holders within 48 hours of the event.' },
    { q: 'Is this event just for designers?', a: 'Not at all. The event welcomes engineers, entrepreneurs, designers, product managers and everyone curious about innovation.' },
    { q: 'Does my ticket cover everything?', a: 'General admission covers all main sessions and networking. Premium tickets include workshops, priority seating, and the after-party.' },
    { q: 'Can I refund or transfer my ticket?', a: 'Tickets are fully transferable up to 48 hours before the event. Refunds are available within 14 days of purchase.' },
    { q: 'What is the conference about?', a: 'EventSphere brings together tech innovators, product leaders, creatives and entrepreneurs for talks, workshops, and networking across 3 days.' },
    { q: 'Are there any perks with my ticket?', a: 'All tickets include a swag bag, access to session recordings, and networking breaks. Premium and VIP tiers include extra perks.' },
  ];

  const reveal = { hidden: { opacity: 0, y: 28 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: [0.23, 1, 0.32, 1] } }) };

  return (
    <div className="bg-[#0a0a0a]">

      {/* ══════════════════════════════════════════════
          HERO — Purple gradient bg, golden centered headline
          Exactly matching screenshots
      ══════════════════════════════════════════════ */}
      <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">

        {/* Parallax background orbs */}
        <motion.div
          style={{ y: heroBgY }}
          className="absolute inset-0 pointer-events-none"
        >
          <motion.div
            style={{ y: floatOrb1Y, background: 'rgba(139,92,246,0.3)' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" />
          <motion.div
            style={{ y: floatOrb2Y, background: 'rgba(124,58,237,0.25)' }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" />
        </motion.div>

        {/* Wavy decorative lines (like Summitra) */}
        <div className="hero-wave">
          <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="720" cy="450" rx="700" ry="350" stroke="white" strokeWidth="1" fill="none" opacity="0.4"/>
            <ellipse cx="720" cy="450" rx="550" ry="250" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
            <ellipse cx="720" cy="450" rx="380" ry="160" stroke="white" strokeWidth="1" fill="none" opacity="0.2"/>
            <path d="M0 500 Q360 300 720 500 Q1080 700 1440 500" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
            <path d="M0 400 Q360 600 720 400 Q1080 200 1440 400" stroke="white" strokeWidth="1" fill="none" opacity="0.2"/>
          </svg>
        </div>

        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Location badge — gold pill like Summitra's "Elgin Celina, Delaware" */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="location-badge">
              <span className="location-icon">
                <MapPin size={13} strokeWidth={2.5} />
              </span>
              Bangalore · Mumbai · Delhi · Goa · Hyderabad
            </div>
          </motion.div>

          {/* GIANT headline — gold on purple, exactly like screenshots */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="font-urban font-black leading-tight tracking-tight mb-6"
            style={{
              fontSize: 'clamp(3.2rem, 9vw, 8.5rem)',
              color: '#f5c842',
              lineHeight: 1.0,
            }}
          >
            Book. Experience.
            <br />
            <span style={{ color: '#f5c842' }}>Remember.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <strong className="text-white">Discover India's best events.</strong>{' '}
            Book instantly and get your digital QR ticket delivered in seconds.
          </motion.p>

          {/* CTA row — white pill + location badge, exactly like Summitra */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* White pill button exactly like Summitra */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/events')}
              className="btn-pill-white"
              style={{ height: '3.25rem', paddingLeft: '1.75rem', fontSize: '1rem' }}
            >
              Book Ticket
              <span className="arrow-circle" style={{ width: '3.25rem', height: '3.25rem' }}>
                <ChevronRight size={18} color="white" strokeWidth={2.5} />
              </span>
            </motion.button>

            {/* Gold location info next to button — like Summitra */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#f5c842' }}>
                <MapPin size={16} color="#0a0a0a" strokeWidth={2.5} />
              </div>
              <span className="text-white text-sm font-medium">Multiple Cities, India</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          SPEAKERS SECTION — Tall portrait cards with coloured bgs
          Exactly like screenshot 2
      ══════════════════════════════════════════════ */}
      <section className="relative bg-[#0a0a0a] py-20 border-b border-white/[0.04] overflow-hidden">
        {/* Parallax purple orb behind speakers */}
        <motion.div
          style={{ y: speakerBgY, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
          className="absolute right-0 top-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex items-center justify-between mb-12">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-2 font-urban">Meet the speakers</p>
              <h2 className="text-3xl md:text-4xl font-black text-white font-urban">
                Meet all the top <span style={{ color: '#7c3aed' }}>IT minds</span>
              </h2>
            </div>
            <Link to="/events"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-colors font-urban">
              All Events <ChevronRight size={14} />
            </Link>
          </motion.div>

          {/* 4-column speaker grid — tall portrait cards like screenshot 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {speakers.map((sp, i) => (
              <SpeakerCard key={sp.name} speaker={sp} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/events')}
              className="btn-pill-white"
              style={{ height: '3rem', fontSize: '0.9rem' }}
            >
              Book Ticket
              <span className="arrow-circle"><ChevronRight size={16} color="white" strokeWidth={2.5} /></span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT + COUNTDOWN — Black bg, huge white text, purple date, countdown boxes
          Exactly like screenshot 3
      ══════════════════════════════════════════════ */}
      <section className="relative bg-[#0a0a0a] py-24 overflow-hidden">
        {/* Parallax floating element */}
        <motion.div
          style={{ y: aboutBgY }}
          className="absolute left-0 top-1/3 pointer-events-none"
        >
          <div className="w-64 h-64 rounded-full blur-3xl opacity-10"
            style={{ background: '#7c3aed' }} />
        </motion.div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">

          {/* "About" heading */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-8">
            <h2 className="text-5xl md:text-7xl font-black text-white font-urban mb-8"
              style={{ lineHeight: 1.05 }}>
              About
            </h2>
          </motion.div>

          {/* Big paragraph text with purple highlight — exactly like screenshot 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-12 max-w-4xl"
          >
            <p className="font-urban font-bold leading-tight mb-2"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)', color: 'rgba(255,255,255,0.95)' }}>
              EventSphere 2025 is an immersive, multi-city event experience over the course of three days,{' '}
              <span style={{ color: '#7c3aed' }}>August 13-15.</span>
            </p>
            <p className="font-urban font-bold leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)', color: 'rgba(255,255,255,0.25)' }}>
              Our mission — to connect India's most ambitious people with world-class experiences and each other.
            </p>
          </motion.div>

          {/* Countdown boxes — exactly like screenshot 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-12 flex-wrap"
          >
            {[
              { val: cd.d, label: 'Days' },
              { val: cd.h, label: 'Hours' },
              { val: cd.m, label: 'Minutes' },
              { val: cd.s, label: 'Seconds' },
            ].map(({ val, label }) => (
              <div key={label} className="countdown-box" style={{ minWidth: '5.5rem' }}>
                <div className="text-4xl font-black text-white font-urban tabular-nums leading-none mb-1">
                  {String(val).padStart(2, '0')}
                </div>
                <div className="text-xs text-white/30 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/events')}
            className="btn-pill-white"
            style={{ height: '3rem', fontSize: '0.9rem' }}
          >
            Book Ticket
            <span className="arrow-circle"><ChevronRight size={16} color="white" strokeWidth={2.5} /></span>
          </motion.button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          EVENTS SHOWCASE
      ══════════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="text-xs text-white/30 uppercase tracking-widest mb-3">Upcoming</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="text-3xl md:text-5xl font-black text-white font-urban">
                Featured <span style={{ color: '#7c3aed' }}>Events</span>
              </motion.h2>
            </div>
            <Link to="/events" className="hidden md:flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors font-urban font-medium">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {events.length > 0
              ? events.map((e, i) => <EventCard key={e.id} event={e} index={i} />)
              : [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="h-52 skeleton" />
                  <div className="p-5 space-y-2.5">
                    <div className="h-4 skeleton w-3/4 rounded" />
                    <div className="h-3 skeleton w-1/2 rounded" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS — Gold numbers
      ══════════════════════════════════════════════ */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              { end: 500, suffix: '+', label: 'Events Hosted' },
              { end: 50000, suffix: '+', label: 'Happy Attendees' },
              { end: 200, suffix: '+', label: 'Cities Covered' },
              { end: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="bg-[#0a0a0a] py-12 px-6">
                <Counter end={end} suffix={suffix} label={label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING SECTION
      ══════════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-black text-white font-urban">
              Pricing for <span style={{ color: '#7c3aed' }}>tickets</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { tier: 'Basic', price: '₹999', highlight: false, features: ['Full event access', 'Keynote & breakout sessions', 'Networking opportunities', 'Post-event recordings', 'Conference materials & swag'] },
              { tier: 'Premium', price: '₹2,499', highlight: true, features: ['Everything in Basic', 'Workshop access', 'Priority seating', 'Speaker meet & greet', 'Lunch included'] },
              { tier: 'VIP', price: '₹4,999', highlight: false, features: ['Everything in Premium', 'Private networking dinner', 'Year-round community', 'Certificate of attendance', 'Dedicated concierge'] },
            ].map(({ tier, price, highlight, features }, i) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative rounded-2xl p-8 flex flex-col"
                style={{
                  background: highlight ? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' : '#111',
                  border: `1px solid ${highlight ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f5c842] text-[#0a0a0a] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full font-urban">
                    Most Popular
                  </div>
                )}
                <div className="text-xs text-white/30 uppercase tracking-widest mb-3 font-urban">{tier}</div>
                <div className="text-4xl font-black text-white font-urban mb-6">{price}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: highlight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>
                      <Star size={11} fill={highlight ? '#f5c842' : '#7c3aed'} color={highlight ? '#f5c842' : '#7c3aed'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/events')}
                  className={`btn-pill-white w-full justify-center ${highlight ? '' : 'opacity-80'}`}
                  style={{ height: '2.9rem', fontSize: '0.88rem', background: highlight ? '#f5c842' : '#fff' }}
                >
                  Get a seat
                  <span className="arrow-circle" style={{ background: highlight ? '#0a0a0a' : '#7c3aed', width: '2.9rem', height: '2.9rem' }}>
                    <ChevronRight size={15} color="white" strokeWidth={2.5} />
                  </span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-black text-white font-urban">Frequently Asked Questions</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            {faqs.map((f, i) => <Faq key={i} q={f.q} a={f.a} i={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden text-center py-20 px-8"
            style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #6d28d9 100%)' }}
          >
            {/* wavy bg */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" viewBox="0 0 800 400" fill="none">
                <ellipse cx="400" cy="200" rx="380" ry="180" stroke="white" strokeWidth="1" fill="none"/>
                <ellipse cx="400" cy="200" rx="280" ry="120" stroke="white" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-4 font-urban">Get started</p>
              <h2 className="text-4xl md:text-6xl font-black text-white font-urban mb-5" style={{ lineHeight: 1.05 }}>
                Your next great experience <br />
                <span style={{ color: '#f5c842' }}>awaits you</span>
              </h2>
              <p className="text-white/60 text-base max-w-lg mx-auto mb-10">
                Join thousands booking extraordinary events across India. Find yours today.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 16px 50px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/events')}
                className="btn-pill-white mx-auto"
                style={{ height: '3.25rem', fontSize: '1rem' }}
              >
                Book Ticket
                <span className="arrow-circle" style={{ width: '3.25rem', height: '3.25rem' }}>
                  <ChevronRight size={18} color="white" strokeWidth={2.5} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}