import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#6d28d9' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2">
            <Link to="/" className="block mb-4">
              <span className="text-2xl font-black text-white font-urban">
                Event<span style={{ color: '#f5c842' }}>Sphere</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-5 max-w-xs">
              Discover, book, and experience extraordinary events across India. Your next memory starts here.
            </p>
            <p className="text-sm font-bold text-white font-urban mb-0.5">August 13-15, 2025</p>
            <p className="text-xs text-white/40">India's Largest Event Platform</p>
          </div>
          {[
            { heading: 'Platform', links: [{ l: 'Browse Events', h: '/events' }, { l: 'My Tickets', h: '/my-bookings' }, { l: 'Admin', h: '/admin' }] },
            { heading: 'Company', links: [{ l: 'About Us', h: '#' }, { l: 'Careers', h: '#' }, { l: 'Press Kit', h: '#' }] },
            { heading: 'Legal', links: [{ l: 'Privacy', h: '#' }, { l: 'Terms', h: '#' }, { l: 'Refunds', h: '#' }] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div className="text-[11px] text-white/30 uppercase tracking-widest font-bold mb-5 font-urban">{heading}</div>
              <ul className="space-y-3">
                {links.map(({ l, h }) => (
                  <li key={l}><Link to={h} className="text-sm text-white/50 hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-xs text-white/30">© 2025 EventSphere. All rights reserved.</p>
          <div className="flex gap-3">
            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all">
                <Icon size={13} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
