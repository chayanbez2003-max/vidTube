import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineVideoCamera } from 'react-icons/hi';
import toast from 'react-hot-toast';


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-5 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[400px] h-[400px] bg-teal-primary -top-[100px] -right-[100px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[300px] h-[300px] bg-sky-top -bottom-[80px] -left-[80px] animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[200px] h-[200px] bg-badge-pink top-[40%] left-[60%] animate-[float_6s_ease-in-out_infinite]" />
      </div>
      
      <motion.div
        className="w-full max-w-[440px] p-8 md:p-10 relative z-10 glass-card bg-bg-surface border border-white/10 rounded-2xl"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-gradient)] flex items-center justify-center text-[28px] text-slate-900 mx-auto mb-4 shadow-[0_4px_20px_rgba(139,92,246,0.35)]">
            <HiOutlineVideoCamera />
          </div>
          <h1 className="text-[26px] font-light text-[var(--text-primary)] mb-1.5">Welcome Back</h1>
          <p className="text-[var(--text-secondary)] text-sm">Sign in to continue to <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">VidTube</span></p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[13px] font-medium text-[var(--text-secondary)] ml-1">Email or Username</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px]" />
              <input
                id="login-email"
                type="text"
                className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary focus:bg-white/[0.08] transition-colors"
                placeholder="Enter email or username"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-[13px] font-medium text-[var(--text-secondary)] ml-1">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px]" />
              <input
                id="login-password"
                type="password"
                className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary focus:bg-white/[0.08] transition-colors"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary w-full justify-center p-[14px] text-[15px] mt-2 border-none cursor-pointer outline-none"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-[14px] text-[var(--text-secondary)]">
          Don't have an account? <Link to="/register" className="text-[var(--primary-soft)] font-semibold no-underline hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}
