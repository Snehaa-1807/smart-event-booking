import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Ticket } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const login = useUserStore(s => s.login);
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.email || !form.password) return setError('Please fill all fields');
    if (mode === 'signup' && !form.name) return setError('Please enter your name');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Enter a valid email');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    // Simple client-side auth (no backend auth endpoint needed)
    // In production this would call an API
    const userData = {
      name: mode === 'signup' ? form.name : form.email.split('@')[0],
      email: form.email,
      avatar: null,
      provider: 'email',
    };

    login(userData);
    setLoading(false);
    onSuccess?.(userData);
    onClose();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1000));

    // Simulate Google login — in production integrate Firebase/Google OAuth
    const userData = {
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: `https://ui-avatars.com/api/?name=Google+User&background=7c3aed&color=fff`,
      provider: 'google',
    };

    login(userData);
    setGoogleLoading(false);
    onSuccess?.(userData);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ pointerEvents: 'none' }}
          >
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'auto' }}>

              {/* Header */}
              <div className="px-8 pt-8 pb-6 relative"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={onClose}
                  className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X size={16} />
                </button>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' }}>
                  <Ticket size={22} color="#f5c842" />
                </div>

                <h2 className="text-2xl font-black text-white font-urban mb-1">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-white/40 text-sm">
                  {mode === 'login'
                    ? 'Sign in to book your tickets'
                    : 'Join EventSphere to get started'}
                </p>
              </div>

              <div className="px-8 py-6 space-y-4">

                {/* Google Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: '#fff', color: '#1a1a1a', opacity: googleLoading ? 0.7 : 1 }}>
                  {googleLoading ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full inline-block" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  )}
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs text-white/25 font-medium">or continue with email</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">

                  {/* Name (signup only) */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}>
                        <div className="relative">
                          <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
                          <input name="name" type="text" placeholder="Full name" value={form.name}
                            onChange={handleChange}
                            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm outline-none placeholder-white/20"
                            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                            onFocus={e => e.target.style.borderColor = '#7c3aed'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
                    <input name="email" type="email" placeholder="Email address" value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm outline-none placeholder-white/20"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
                    <input name="password" type={showPass ? 'text' : 'password'} placeholder="Password"
                      value={form.password} onChange={handleChange}
                      className="w-full rounded-xl pl-11 pr-12 py-3.5 text-white text-sm outline-none placeholder-white/20"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs text-red-400 px-1 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{error}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm font-urban text-white"
                    style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', opacity: loading ? 0.7 : 1 }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </motion.button>
                </form>

                {/* Toggle */}
                <p className="text-center text-sm text-white/40 pb-2">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setForm({ name: '', email: '', password: '' }); }}
                    className="font-semibold transition-colors" style={{ color: '#7c3aed' }}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}