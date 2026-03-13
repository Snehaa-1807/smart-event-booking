import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, MapPin, Users, Minus, Plus, ArrowLeft, Share2, Heart,
  Clock, Download, CheckCircle, Ticket, ChevronRight, Star, Zap,
  ShieldCheck, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { eventsAPI, bookingsAPI, SERVER_URL } from '../utils/api';
import { resolveImage, FALLBACK } from '../utils/imageHelper';
import socket from '../utils/socket';
import { useEventStore } from '../store/index.js';
import { useUserStore } from '../store/userStore';
import LoginModal from '../components/ui/LoginModal';

/* ─── Draw full ticket onto a canvas for download ─── */
async function drawTicketCanvas(canvas, booking, event, form, quantity, totalAmount, categoryName) {
  if (!canvas) return;
  const W = 900, H = 380;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, W, H);

  // Purple left accent bar
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#7c3aed');
  grad.addColorStop(1, '#5b21b6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, H);

  // Header band
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(8, 0, W - 8, 70);

  // Logo text
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Event', 32, 44);
  ctx.fillStyle = '#f5c842';
  ctx.fillText('Sphere', 32 + ctx.measureText('Event').width, 44);

  // TICKET label top right
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'right';
  ctx.fillText('E-TICKET', W - 24, 44);
  ctx.textAlign = 'left';

  // Dashed divider after header
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, 70); ctx.lineTo(W, 70); ctx.stroke();
  ctx.setLineDash([]);

  // Event title
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  const title = (event?.title || 'Event').substring(0, 42);
  ctx.fillText(title, 32, 112);

  // Booking ID badge
  const bid = `#${booking?.id || '----'}`;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#7c3aed';
  const bidW = ctx.measureText(bid).width + 20;
  ctx.fillStyle = 'rgba(124,58,237,0.2)';
  ctx.beginPath();
  ctx.roundRect(32, 122, bidW, 22, 6);
  ctx.fill();
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText(bid, 42, 137);

  // Info columns
  const cols = [
    { label: 'ATTENDEE', val: (form.name || '').substring(0, 20) },
    { label: 'DATE', val: event?.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
    { label: 'LOCATION', val: (event?.location || '-').substring(0, 18) },
    { label: 'CATEGORY', val: categoryName || 'General' },
    { label: 'TICKETS', val: `${quantity}x` },
    { label: 'TOTAL', val: `Rs. ${totalAmount?.toLocaleString() || 0}` },
  ];

  cols.forEach((col, i) => {
    const x = 32 + (i % 3) * 240;
    const y = i < 3 ? 185 : 255;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(col.label, x, y);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = col.label === 'TOTAL' ? '#f5c842' : '#ffffff';
    ctx.fillText(col.val, x, y + 20);
  });

  // Vertical dashed divider before QR
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W - 180, 80); ctx.lineTo(W - 180, H - 20); ctx.stroke();
  ctx.setLineDash([]);

  // Notch circles on divider
  ctx.fillStyle = '#0f0f0f';
  ctx.beginPath(); ctx.arc(W - 180, 80, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 180, H - 20, 14, 0, Math.PI * 2); ctx.fill();

  // QR code area
  const qrX = W - 160, qrY = 95, qrSize = 130;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, qrSize, qrSize, 8);
  ctx.fill();

  // Draw QR pattern
  const qrText = `EVENTSPHERE|${booking?.id}|${form.email}|${quantity}`;
  let hash = 0;
  for (let i = 0; i < qrText.length; i++) {
    hash = ((hash << 5) - hash) + qrText.charCodeAt(i); hash |= 0;
  }
  const mod = qrSize / 21;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      const isCorner = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      const bit = isCorner || ((hash * (r * 21 + c + 1) * 2654435761) >>> 0) % 2 === 0;
      if (bit) {
        ctx.fillStyle = isCorner ? '#7c3aed' : '#f5c842';
        ctx.beginPath();
        ctx.roundRect(qrX + c * mod + 2, qrY + r * mod + 2, mod - 2, mod - 2, 1);
        ctx.fill();
      }
    }
  }

  // Scan label below QR
  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN AT ENTRY', qrX + qrSize / 2, qrY + qrSize + 18);

  // Status badge bottom left
  ctx.fillStyle = 'rgba(34,197,94,0.15)';
  ctx.beginPath(); ctx.roundRect(32, H - 44, 120, 26, 6); ctx.fill();
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.textAlign = 'left';
  ctx.fillText('✓  CONFIRMED', 44, H - 26);

  // Email bottom
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(form.email, 170, H - 26);
}

/* ─── Simple QR for preview in ticket card ─── */
function generateQR(text, canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, size, size);
  let hash = 0;
  for (let i = 0; i < text.length; i++) { hash = ((hash << 5) - hash) + text.charCodeAt(i); hash |= 0; }
  const mod = size / 21;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      const isCorner = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      const bit = isCorner || ((hash * (r * 21 + c + 1) * 2654435761) >>> 0) % 2 === 0;
      if (bit) {
        ctx.fillStyle = isCorner ? '#7c3aed' : '#f5c842';
        ctx.fillRect(c * mod + 1, r * mod + 1, mod - 1, mod - 1);
      }
    }
  }
}

/* ─── Seat progress ring ─── */
function SeatRing({ available, total }) {
  const pct = Math.max(0, available / total);
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  const color = pct < 0.15 ? '#ef4444' : pct < 0.4 ? '#f5c842' : '#7c3aed';
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg width="128" height="128" className="absolute inset-0">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: dash }}
          transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: '64px 64px', rotate: '-90deg' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white font-urban">{available}</span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">left</span>
      </div>
    <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(userData) => {
          setForm(f => ({ ...f, name: userData.name, email: userData.email }));
          setStep(1);
        }}
      />
    </div>
  );
}

/* ─── Ticket category card ─── */
function TicketCategory({ category, price, description, perks, selected, onSelect, disabled }) {
  return (
    <motion.div
      whileHover={!disabled ? { y: -3 } : {}}
      onClick={() => !disabled && onSelect()}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      style={{
        background: selected ? 'rgba(124,58,237,0.2)' : '#111',
        border: selected ? '1.5px solid #7c3aed' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
          <CheckCircle size={12} color="white" />
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs text-[#a78bfa] font-semibold uppercase tracking-wider">{category}</span>
          <h4 className="text-lg font-black text-white font-urban mt-0.5">₹{price.toLocaleString()}</h4>
        </div>
        <Ticket size={18} className="text-white/20 mt-1" />
      </div>
      <p className="text-xs text-white/40 mb-3 leading-relaxed">{description}</p>
      <ul className="space-y-1.5">
        {perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-xs text-white/50">
            <Star size={9} fill="#f5c842" color="#f5c842" />
            {p}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ─── Confetti burst ─── */
function fireConfetti() {
  const end = Date.now() + 2800;
  const colors = ['#7c3aed', '#f5c842', '#8b5cf6', '#ffd84d', '#a78bfa'];

  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  // Central burst
  setTimeout(() => {
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors, scalar: 1.2 });
  }, 400);
}

/* ─── Booking step indicator ─── */
function StepBar({ step }) {
  const steps = ['Details', 'Checkout', 'Confirmed'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex flex-col items-center gap-1 ${i <= step ? '' : 'opacity-30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-urban transition-all ${
              i < step ? 'bg-[#7c3aed] text-white' :
              i === step ? 'bg-[#f5c842] text-[#0a0a0a]' :
              'bg-white/10 text-white/40'
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider hidden sm:block">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-px mx-2 transition-all ${i < step ? 'bg-[#7c3aed]' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════ */
export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentEvent, setCurrentEvent, updateEventSeats } = useEventStore();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0=details, 1=checkout, 2=success
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', mobile: '' });
  const [formErrors, setFormErrors] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [liked, setLiked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const user = useUserStore(s => s.user);

  const qrCanvasRef = useRef(null);
  const heroRef = useRef(null);

  // Parallax on hero image — use window scroll (no target ref, avoids hydration warning)
  const { scrollYProgress } = useScroll({ layoutEffect: false });
  const heroImgY = useTransform(scrollYProgress, [0, 0.3], ['0%', '35%']);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => {
    setLoading(true);
    eventsAPI.getById(id)
      .then(r => setCurrentEvent(r.data))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    socket.on('seats:updated', ({ event_id, available_seats }) => {
      if (parseInt(event_id) === parseInt(id)) updateEventSeats(event_id, available_seats);
    });
    return () => socket.off('seats:updated');
  }, [id]);

  // Draw small QR preview on inline canvas when success screen shows
  useEffect(() => {
    if (step === 2 && bookingResult && qrCanvasRef.current) {
      const text = `EVENTSPHERE|${bookingResult.id}|${form.email}|${quantity}`;
      generateQR(text, qrCanvasRef.current);
    }
  }, [step, bookingResult]);

  const event = currentEvent;

  const ticketCategories = event ? [
    {
      category: 'General', price: event.price,
      description: 'Full event access with standard seating.',
      perks: ['Event access', 'Networking breaks', 'Digital materials'],
    },
    {
      category: 'Premium', price: Math.round(event.price * 1.8),
      description: 'Priority seating and exclusive workshop access.',
      perks: ['Priority seating', 'Workshop access', 'Lunch included', 'Swag bag'],
    },
    {
      category: 'VIP', price: Math.round(event.price * 3.2),
      description: 'The full experience with speaker access.',
      perks: ['Front-row seating', 'Speaker meet & greet', 'After-party access', 'Certificate'],
    },
  ] : [];

  const selectedPrice = ticketCategories[selectedCategory]?.price || 0;
  const totalAmount = selectedPrice * quantity;

  function validateForm() {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.mobile || !/^\d{10}$/.test(form.mobile.replace(/\s/g, ''))) e.mobile = 'Enter a 10-digit number';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleBook() {
    if (!validateForm()) return;
    setBookingLoading(true);
    try {
      const payload = {
        event_id: parseInt(id),
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim().replace(/\s/g, ''),
        quantity: parseInt(quantity),
      };

      // Use raw fetch to avoid any axios interceptor issues
      const response = await fetch(`${SERVER_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      console.log('Booking response:', json);

      if (!response.ok || !json.success) {
        throw new Error(json.message || json.errors?.[0] || 'Booking failed');
      }

      const booking = json.data;
      setBookingResult(booking);
      setStep(2);
      fireConfetti();
      toast.success('🎉 Booking confirmed!');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  async function downloadTicket() {
    // Create an offscreen canvas for the full downloadable ticket
    const offscreen = document.createElement('canvas');
    const categoryName = ticketCategories[selectedCategory]?.category || 'General';
    await drawTicketCanvas(offscreen, bookingResult, event, form, quantity, totalAmount, categoryName);
    const link = document.createElement('a');
    link.download = `eventsphere-ticket-${bookingResult?.id || 'ticket'}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
    toast.success('🎫 Ticket downloaded!');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#7c3aed]"
          />
          <span className="text-white/30 text-sm">Loading event...</span>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const soldPct = Math.round(((event.total_seats - event.available_seats) / event.total_seats) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-[72px]">

      {/* ── Parallax Hero Image ── */}
      <div ref={heroRef} className="relative h-[55vh] overflow-hidden">
        <motion.div
          style={{ y: heroImgY, scale: heroScale }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={resolveImage(event.img)}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        </motion.div>

        {/* Hero overlay content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 flex flex-col justify-end px-6 lg:px-10 pb-10 max-w-7xl mx-auto w-full left-0 right-0"
        >
          <button onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-5 transition-colors text-sm group w-fit">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </button>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.3)' }}>
              Live Event
            </span>
            {event.available_seats < 100 && (
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                Almost Full
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white font-urban leading-tight max-w-3xl">
            {event.title}
          </h1>
        </motion.div>

        {/* Action icons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { setLiked(!liked); toast.success(liked ? 'Removed from wishlist' : 'Added to wishlist!'); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'white'} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <Share2 size={16} color="white" />
          </motion.button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {/* Step indicator when booking */}
        <AnimatePresence mode="wait">
          {step > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <StepBar step={step} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ════ STEP 0: EVENT DETAILS ════ */}
          {step === 0 && (
            <motion.div key="details"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-10"
            >
              {/* Left: Info */}
              <div className="lg:col-span-3 space-y-8">

                {/* Meta row */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Calendar, text: new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), color: '#7c3aed' },
                    { icon: Clock, text: new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), color: '#7c3aed' },
                    { icon: MapPin, text: event.location, color: '#f5c842' },
                    { icon: Users, text: `${event.available_seats} seats available`, color: '#22c55e' },
                  ].map(({ icon: Icon, text, color }) => (
                    <div key={text} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl"
                      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon size={13} color={color} />
                      <span className="text-white/60">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-lg font-black text-white font-urban mb-3">About This Event</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{event.description}</p>
                </div>

                {/* Seat availability with ring */}
                <div className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-lg font-black text-white font-urban mb-6">Seat Availability</h3>
                  <div className="flex items-center gap-8">
                    <SeatRing available={event.available_seats} total={event.total_seats} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-white/40 mb-2">
                        <span>{event.available_seats} of {event.total_seats} seats</span>
                        <span>{soldPct}% filled</span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${soldPct}%` }}
                          transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full rounded-full"
                          style={{ background: soldPct > 85 ? '#ef4444' : soldPct > 60 ? '#f5c842' : '#7c3aed' }}
                        />
                      </div>
                      {event.available_seats < 100 && (
                        <motion.p
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-xs mt-3 flex items-center gap-1.5"
                          style={{ color: '#fbbf24' }}>
                          <Zap size={12} fill="#fbbf24" />
                          Only {event.available_seats} tickets remaining!
                        </motion.p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Google Maps embed */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-6 pt-5 pb-3" style={{ background: '#111' }}>
                    <h3 className="text-lg font-black text-white font-urban mb-1">Location</h3>
                    <p className="text-sm text-white/40 flex items-center gap-1.5">
                      <MapPin size={12} color="#f5c842" />
                      {event.location}
                    </p>
                  </div>
                  <div className="h-52 relative">
                    <iframe
                      title="Event Location"
                      width="100%" height="100%"
                      style={{ border: 0, filter: 'invert(95%) hue-rotate(180deg) saturate(0.8) brightness(0.85)' }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location + ', India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Booking sidebar */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 space-y-5">

                  {/* Price + ticket categories */}
                  <div className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Starting from</div>
                    <div className="text-4xl font-black text-white font-urban mb-6">
                      ₹{parseFloat(event.price).toLocaleString()}
                    </div>

                    {/* Ticket categories */}
                    <div className="space-y-3 mb-6">
                      {ticketCategories.map((cat, i) => (
                        <TicketCategory
                          key={cat.category}
                          {...cat}
                          selected={selectedCategory === i}
                          onSelect={() => setSelectedCategory(i)}
                          disabled={event.available_seats === 0}
                        />
                      ))}
                    </div>

                    {/* Quantity selector */}
                    <div className="mb-5">
                      <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Quantity</div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <Minus size={14} color="white" />
                        </button>
                        <span className="text-3xl font-black text-white font-urban w-10 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(q => Math.min(10, Math.min(event.available_seats, q + 1)))}
                          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <Plus size={14} color="white" />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-xl p-4 mb-5"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex justify-between text-sm text-white/30 mb-2">
                        <span>₹{selectedPrice.toLocaleString()} × {quantity}</span>
                        <span>₹{(selectedPrice * quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/30 mb-3">
                        <span>Convenience fee</span>
                        <span className="text-green-400">Free</span>
                      </div>
                      <div className="flex justify-between border-t border-white/[0.06] pt-3">
                        <span className="font-bold text-white text-sm">Total</span>
                        <span className="text-xl font-black font-urban" style={{ color: '#f5c842' }}>
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={event.available_seats === 0}
                      onClick={() => {
                        if (event.available_seats === 0) return;
                        if (!user) { setShowLoginModal(true); return; }
                        setStep(1);
                      }}
                      className="btn-pill-white w-full justify-center"
                      style={{
                        height: '3.25rem', fontSize: '0.95rem',
                        opacity: event.available_seats === 0 ? 0.4 : 1,
                        cursor: event.available_seats === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {event.available_seats === 0 ? 'Sold Out' : 'Proceed to Checkout'}
                      <span className="arrow-circle" style={{ width: '3.25rem', height: '3.25rem' }}>
                        <ChevronRight size={17} color="white" strokeWidth={2.5} />
                      </span>
                    </motion.button>

                    <div className="flex items-center justify-center gap-3 mt-4 text-xs text-white/20">
                      <ShieldCheck size={12} />
                      <span>Secure checkout · Instant confirmation</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STEP 1: CHECKOUT ════ */}
          {step === 1 && (
            <motion.div key="checkout"
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              className="max-w-2xl mx-auto"
            >
              <button onClick={() => setStep(0)}
                className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors text-sm group">
                <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                Back to event
              </button>

              <h2 className="text-3xl font-black text-white font-urban mb-8">
                Complete your <span style={{ color: '#7c3aed' }}>booking</span>
              </h2>

              {/* Order summary */}
              <div className="rounded-2xl p-5 mb-6 flex gap-4"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={resolveImage(event.img)} alt={event.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white font-urban text-sm truncate mb-1">{event.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-white/30 mb-0.5">
                    <MapPin size={10} />{event.location}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                      {ticketCategories[selectedCategory]?.category}
                    </span>
                    <span className="text-xs text-white/30">{quantity} ticket{quantity > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-urban" style={{ color: '#f5c842' }}>
                    ₹{totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="rounded-2xl p-6 space-y-5 mb-6"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-black text-white font-urban">Attendee Details</h3>
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
                  { label: 'Mobile Number', key: 'mobile', type: 'tel', placeholder: '10-digit mobile number' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block">
                      {label}
                    </label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => {
                        setForm(f => ({ ...f, [key]: e.target.value }));
                        if (formErrors[key]) setFormErrors(err => ({ ...err, [key]: '' }));
                      }}
                      className={`w-full rounded-xl px-4 py-3.5 text-white text-sm transition-all outline-none placeholder-white/20 ${
                        formErrors[key] ? 'border-red-500/60' : 'border-white/[0.07]'
                      }`}
                      style={{
                        background: '#0a0a0a',
                        border: `1px solid ${formErrors[key] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = formErrors[key] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}
                    />
                    {formErrors[key] && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                        <X size={10} /> {formErrors[key]}
                      </motion.p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pay button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBook}
                disabled={bookingLoading}
                className="btn-pill-white w-full justify-center"
                style={{ height: '3.5rem', fontSize: '1rem', opacity: bookingLoading ? 0.7 : 1 }}
              >
                {bookingLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      <RefreshCw size={16} />
                    </motion.span>
                    Processing...
                  </span>
                ) : (
                  <>
                    Confirm & Pay ₹{totalAmount.toLocaleString()}
                    <span className="arrow-circle" style={{ width: '3.5rem', height: '3.5rem' }}>
                      <ChevronRight size={18} color="white" strokeWidth={2.5} />
                    </span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ════ STEP 2: SUCCESS + CONFETTI + QR ════ */}
          {step === 2 && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-lg mx-auto text-center"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' }}
              >
                <CheckCircle size={44} color="#f5c842" strokeWidth={2} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-black text-white font-urban mb-3"
              >
                You're in! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/40 mb-10 text-sm"
              >
                Your booking is confirmed. Show your QR code at the venue entrance.
              </motion.p>

              {/* Ticket card — styled like a real ticket */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="ticket-card mb-6 text-left overflow-hidden"
              >
                {/* Top section */}
                <div className="p-6 pb-5" style={{ borderBottom: '2px dashed rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-4">
                    <img src={resolveImage(event.img)} alt={event.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-[#a78bfa] font-bold uppercase tracking-wider mb-1">
                        Booking #{bookingResult?.id}
                      </div>
                      <h3 className="font-black text-white font-urban text-base leading-tight mb-1">{event.title}</h3>
                      <div className="text-xs text-white/30 flex items-center gap-1">
                        <MapPin size={10} /> {event.location}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom section with QR */}
                <div className="p-6 flex items-center gap-6">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                    {[
                      { label: 'Name', val: form.name },
                      { label: 'Category', val: ticketCategories[selectedCategory]?.category },
                      { label: 'Tickets', val: `${quantity}x` },
                      { label: 'Total', val: `₹${totalAmount.toLocaleString()}` },
                      { label: 'Date', val: new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
                      { label: 'Status', val: '✓ Confirmed' },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-xs font-semibold text-white/70">{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* QR Code preview — drawn by generateQR for inline display */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#1a1a1a]">
                      <canvas
                        ref={qrCanvasRef}
                        width={96} height={96}
                        className="w-full h-full"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="text-[9px] text-white/20 text-center mt-1">Scan at entry</div>
                  </div>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={downloadTicket}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm font-urban"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                >
                  <Download size={15} />
                  Download QR Ticket
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/my-bookings')}
                  className="btn-pill-white flex-1 justify-center"
                  style={{ height: '3.1rem', fontSize: '0.88rem' }}
                >
                  My Tickets
                  <span className="arrow-circle" style={{ width: '3.1rem', height: '3.1rem' }}>
                    <ChevronRight size={16} color="white" strokeWidth={2.5} />
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}