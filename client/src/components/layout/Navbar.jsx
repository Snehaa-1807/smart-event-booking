import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Ticket } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => setMobileOpen(false), [location]);

  const navBg = isHome
    ? scrolled
      ? 'bg-[#6d28d9]'
      : 'bg-transparent'
    : 'bg-[#6d28d9]';

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${navBg} ${scrolled ? 'shadow-2xl shadow-purple-900/40' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">

        {/* Logo — white bold like "Summitra" */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[1.4rem] font-black text-white tracking-tight font-urban">
            Event<span style={{ color: '#f5c842' }}>Sphere</span>
          </span>
        </Link>

        {/* Center: nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Events', href: '/events' },
            { label: 'My Tickets', href: '/my-bookings' },
            { label: 'Admin', href: '/admin' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`text-sm font-medium transition-colors ${
                location.pathname.startsWith(href)
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
              style={{ fontFamily: 'Urbanist, sans-serif' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: contact + CTA pill */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-semibold text-white font-urban">(888) 123 4567</div>
            <div className="text-xs text-white/50">info@eventsphere.com</div>
          </div>

          {/* White pill button with purple circle arrow — exactly like Summitra */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/events" className="btn-pill-white" style={{ height: '2.75rem' }}>
              Book Ticket
              <span className="arrow-circle">
                <ChevronRight size={16} color="white" strokeWidth={2.5} />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#6d28d9] border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {[
                { label: 'Events', href: '/events' },
                { label: 'My Tickets', href: '/my-bookings' },
                { label: 'Admin', href: '/admin' },
              ].map(({ label, href }) => (
                <Link key={label} to={href}
                  className="flex items-center justify-between py-3 text-white/80 hover:text-white text-sm font-medium border-b border-white/5 font-urban">
                  {label} <ChevronRight size={14} />
                </Link>
              ))}
              <div className="pt-3">
                <Link to="/events" className="btn-pill-white w-full justify-center" style={{ height: '2.75rem' }}>
                  Book Ticket
                  <span className="arrow-circle"><ChevronRight size={16} color="white" strokeWidth={2.5} /></span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
