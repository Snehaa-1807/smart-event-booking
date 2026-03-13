import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import MyBookingsPage from './pages/MyBookingsPage';
import { useAdminStore } from './store/adminStore';

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

// Protect admin route — redirect to login if not authenticated
function AdminGuard() {
  const isAdmin = useAdminStore(s => s.isAdmin);
  return isAdmin ? <PageWrapper><AdminPage /></PageWrapper> : <Navigate to="/admin-login" replace />;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hide navbar on admin login page */}
      {!isAdminRoute && <Navbar />}
      {isAdminRoute && location.pathname === '/admin' && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/events" element={<PageWrapper><EventsPage /></PageWrapper>} />
          <Route path="/events/:id" element={<PageWrapper><EventDetailsPage /></PageWrapper>} />
          <Route path="/my-bookings" element={<PageWrapper><MyBookingsPage /></PageWrapper>} />
          <Route path="/admin-login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
          <Route path="/admin" element={<AdminGuard />} />
        </Routes>
      </AnimatePresence>
      {!isAdminRoute && <Footer />}
      {isAdminRoute && location.pathname === '/admin' && <Footer />}
    </div>
  );
}