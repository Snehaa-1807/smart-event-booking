import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAdminStore(s => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // small delay for UX
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' }}
          >
            <ShieldCheck size={30} color="#f5c842" />
          </motion.div>
          <h1 className="text-3xl font-black text-white font-urban mb-2">
            Admin <span style={{ color: '#7c3aed' }}>Portal</span>
          </h1>
          <p className="text-white/30 text-sm">Sign in to access the dashboard</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  className="w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm outline-none placeholder-white/20"
                  style={{ background: '#0a0a0a', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}` }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="rgba(255,255,255,0.25)" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full rounded-xl pl-11 pr-12 py-3.5 text-white text-sm outline-none placeholder-white/20"
                  style={{ background: '#0a0a0a', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}` }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 flex items-center gap-1.5 px-1"
              >
                <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 rounded-xl font-bold text-sm font-urban transition-all mt-2"
              style={{
                background: loading || !username || !password
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                color: 'white',
                cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          EventSphere Admin Portal · Restricted Access
        </p>
      </motion.div>
    </div>
  );
}