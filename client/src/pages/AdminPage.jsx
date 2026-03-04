import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Calendar, Users, DollarSign,
  TrendingUp, Check, Upload, Image as ImageIcon, Loader2,
  AlertCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsAPI, bookingsAPI, uploadAPI } from '../utils/api';
import { resolveImage } from '../utils/imageHelper';

const emptyForm = {
  title: '', description: '', location: '',
  date: '', total_seats: '', available_seats: '',
  price: '', img: ''
};

/* ─── Image Upload Widget ─── */
function ImageUploader({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState('');

  // Whenever `value` changes externally, update preview
  useEffect(() => {
    setPreview(resolveImage(value));
  }, [value]);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)'); return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const res = await uploadAPI.uploadImage(file);
      if (res.success) {
        onChange(res.url); // e.g. "/uploads/event-uuid.jpg"
        toast.success('Image uploaded ✓');
      } else {
        toast.error('Upload failed');
        setPreview(resolveImage(value));
      }
    } catch (err) {
      toast.error('Upload error: ' + err.message);
      setPreview(resolveImage(value));
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const hasImage = preview && !preview.includes('unsplash.com/photo-1492684223066');

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          border: `2px dashed ${dragOver ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
          background: dragOver ? 'rgba(124,58,237,0.08)' : '#0a0a0a',
          minHeight: hasImage ? 'auto' : '140px',
        }}
      >
        {hasImage ? (
          /* Image preview */
          <div className="relative group">
            <img
              src={preview}
              alt="Event preview"
              className="w-full h-52 object-cover"
              onError={() => setPreview('')}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-white text-sm font-semibold backdrop-blur">
                <Upload size={14} /> Change image
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-[#7c3aed] mb-3" />
            ) : (
              <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
                style={{ background: dragOver ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ImageIcon size={22} color={dragOver ? '#a78bfa' : 'rgba(255,255,255,0.25)'} />
              </div>
            )}
            <p className="text-sm font-semibold text-white/50 mb-1">
              {uploading ? 'Uploading...' : dragOver ? 'Drop to upload' : 'Click or drag image here'}
            </p>
            <p className="text-xs text-white/20">JPG, PNG, WEBP — max 10MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {/* OR: paste URL */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-white/20">or paste URL</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <input
        type="url"
        placeholder="https://..."
        value={value?.startsWith('http') ? value : ''}
        onChange={e => { onChange(e.target.value); setPreview(e.target.value); }}
        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/20"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
        onFocus={e => e.target.style.borderColor = '#7c3aed'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
      />
    </div>
  );
}

/* ─── Form field ─── */
function Field({ label, children, error }) {
  return (
    <div>
      <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block font-urban">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════
   MAIN ADMIN PAGE
════════════════════════════════════ */
export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('events');
  const [modal, setModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [evRes, bkRes, stRes] = await Promise.all([
        eventsAPI.getAll(),
        bookingsAPI.getAll(),
        bookingsAPI.getStats(),
      ]);
      setEvents(evRes.data || []);
      setBookings(bkRes.data || []);
      setStats(stRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditEvent(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(ev) {
    setEditEvent(ev);
    setForm({
      ...ev,
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : '',
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.date || !form.total_seats || !form.price) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        available_seats: form.available_seats || form.total_seats,
      };
      if (editEvent) {
        await eventsAPI.update(editEvent.id, payload);
        toast.success('Event updated!');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event created!');
      }
      setModal(false);
      fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event and all its bookings?')) return;
    setDeleting(id);
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(null); }
  }

  async function cancelBooking(id) {
    try {
      await bookingsAPI.cancel(id);
      toast.success('Booking cancelled');
      fetchAll();
    } catch (err) { toast.error(err.message); }
  }

  const statCards = [
    { label: 'Total Events', value: events.length, icon: Calendar, color: '#7c3aed' },
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: Users, color: '#f5c842' },
    { label: 'Revenue', value: stats ? `₹${Math.round(parseFloat(stats.total_revenue || 0) / 1000)}k` : '₹0', icon: DollarSign, color: '#22c55e' },
    { label: 'Tickets Sold', value: stats?.total_tickets || 0, icon: TrendingUp, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-[72px]">

      {/* Purple header band */}
      <div className="relative overflow-hidden py-12 px-6 lg:px-10"
        style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #6d28d9 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1200 200" fill="none">
            <ellipse cx="600" cy="100" rx="580" ry="80" stroke="white" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2 font-urban">Admin</p>
          <h1 className="text-4xl md:text-5xl font-black text-white font-urban">
            Control <span style={{ color: '#f5c842' }}>Center</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-6"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={20} color={color} />
              </div>
              <div className="text-2xl font-black text-white font-urban mb-0.5">{value}</div>
              <div className="text-xs text-white/30">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2">
            {['events', 'bookings'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all font-urban ${
                  tab === t
                    ? 'text-white' : 'text-white/30 hover:text-white'
                }`}
                style={{
                  background: tab === t ? 'rgba(124,58,237,0.2)' : '#111',
                  border: `1px solid ${tab === t ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                {t} {t === 'events' ? `(${events.length})` : `(${bookings.length})`}
              </button>
            ))}
          </div>
          {tab === 'events' && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openCreate}
              className="btn-pill-white"
              style={{ height: '2.7rem', fontSize: '0.85rem' }}>
              <Plus size={14} /> New Event
              <span className="arrow-circle" style={{ width: '2.7rem', height: '2.7rem' }}>
                <ChevronRight size={14} color="white" />
              </span>
            </motion.button>
          )}
        </div>

        {/* ── EVENTS TABLE ── */}
        {tab === 'events' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
            {loading ? (
              <div className="p-10 flex justify-center">
                <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Event', 'Date', 'Location', 'Seats', 'Price', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-white/25 uppercase tracking-widest font-urban">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, i) => (
                      <motion.tr key={ev.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {/* Fixed image rendering */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a] flex items-center justify-center">
                              <img
                                src={resolveImage(ev.img)}
                                alt={ev.title}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a1a"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white font-urban line-clamp-1 max-w-[180px]">{ev.title}</p>
                              <p className="text-xs text-white/25">ID #{ev.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-white/40 whitespace-nowrap">
                          {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-xs text-white/40 max-w-[120px] truncate">{ev.location}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${ev.available_seats < 50 ? 'text-[#f5c842]' : 'text-[#22c55e]'}`}>
                            {ev.available_seats}/{ev.total_seats}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-white font-urban">
                          ₹{parseFloat(ev.price).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(ev)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-[#a78bfa] transition-colors"
                              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(ev.id)}
                              disabled={deleting === ev.id}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
                              {deleting === ev.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && (
                  <div className="py-16 text-center text-white/20 text-sm">
                    No events yet. Create your first event!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS TABLE ── */}
        {tab === 'bookings' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'Event', 'Customer', 'Tickets', 'Amount', 'Date', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-white/25 uppercase tracking-widest font-urban">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <motion.tr key={b.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4 text-xs text-white/25">#{b.id}</td>
                      <td className="px-5 py-4 text-xs font-medium text-white max-w-[140px] truncate">{b.event_title}</td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-white">{b.name}</div>
                        <div className="text-[10px] text-white/25">{b.email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/40">{b.quantity}</td>
                      <td className="px-5 py-4 text-sm font-bold text-white font-urban">₹{parseFloat(b.total_amount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-white/30 whitespace-nowrap">
                        {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                          style={{
                            background: b.status === 'confirmed' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                            color: b.status === 'confirmed' ? '#4ade80' : '#f87171',
                            border: `1px solid ${b.status === 'confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.18)'}`,
                          }}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {b.status === 'confirmed' && (
                          <button onClick={() => cancelBooking(b.id)}
                            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors font-semibold">
                            Cancel
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="py-16 text-center text-white/20 text-sm">No bookings yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════ EVENT MODAL with image upload ════ */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl overflow-hidden mb-8"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-7 py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-xl font-black text-white font-urban">
                  {editEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button onClick={() => setModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Image upload — most prominent */}
                <Field label="Event Image">
                  <ImageUploader
                    value={form.img}
                    onChange={url => setForm(f => ({ ...f, img: url }))}
                  />
                </Field>

                <Field label="Event Title *">
                  <input
                    type="text" placeholder="e.g. TechFest 2025 — Innovation Summit"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/20"
                    style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    rows={3} placeholder="Describe your event..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/20 resize-none"
                    style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Location *">
                    <input
                      type="text" placeholder="e.g. Bangalore, India"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/20"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                    />
                  </Field>
                  <Field label="Date & Time *">
                    <input
                      type="datetime-local"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', colorScheme: 'dark' }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Seats *', key: 'total_seats', ph: '500' },
                    { label: 'Available Seats', key: 'available_seats', ph: 'Auto' },
                    { label: 'Price (₹) *', key: 'price', ph: '999' },
                  ].map(({ label, key, ph }) => (
                    <Field key={key} label={label}>
                      <input
                        type="number" placeholder={ph}
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/20"
                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                      />
                    </Field>
                  ))}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-7 py-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white transition-colors font-urban"
                  style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-pill-white justify-center"
                  style={{ height: '2.9rem', fontSize: '0.88rem', opacity: saving ? 0.7 : 1 }}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" /> Saving...
                    </span>
                  ) : (
                    <>
                      <Check size={14} /> {editEvent ? 'Save Changes' : 'Create Event'}
                      <span className="arrow-circle" style={{ width: '2.9rem', height: '2.9rem' }}>
                        <ChevronRight size={14} color="white" />
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}