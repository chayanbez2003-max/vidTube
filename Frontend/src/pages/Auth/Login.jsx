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
    <div className="min-h-screen flex items-center justify-center py-12 px-5 relative overflow-hidden bg-bg-base">
      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full blur-[100px] opacity-25 w-[450px] h-[450px] bg-[var(--primary)] -top-[120px] -right-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute rounded-full blur-[100px] opacity-20 w-[350px] h-[350px] bg-[#8EC5D6] -bottom-[80px] -left-[80px] animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute rounded-full blur-[100px] opacity-15 w-[250px] h-[250px] bg-[var(--accent)] top-[35%] left-[55%] animate-[float_6s_ease-in-out_infinite]" />
      </div>
      
      <motion.div
        className="w-full max-w-[430px] p-8 md:p-10 relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06),_inset_0_1px_1px_rgba(255,255,255,0.4)]"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[28px] text-white mx-auto mb-4 shadow-[0_8px_24px_rgba(139,92,246,0.25)]">
            <HiOutlineVideoCamera />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 text-[14.5px]">
            Sign in to continue to{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent font-semibold">
              VidTube
            </span>
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[13px] font-semibold text-slate-600 ml-1">
              Email or Username
            </label>
            <div className="relative group">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[19px] transition-colors group-focus-within:text-[var(--primary)]" />
              <input
                id="login-email"
                type="text"
                className="w-full bg-white/50 border border-slate-200/80 rounded-xl px-4 py-3.5 pl-[46px] text-[14.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:bg-white/90 focus:ring-4 focus:ring-[var(--primary)]/10 transition-all shadow-sm"
                placeholder="Enter email or username"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-[13px] font-semibold text-slate-600 ml-1">
              Password
            </label>
            <div className="relative group">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[19px] transition-colors group-focus-within:text-[var(--primary)]" />
              <input
                id="login-password"
                type="password"
                className="w-full bg-white/50 border border-slate-200/80 rounded-xl px-4 py-3.5 pl-[46px] text-[14.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:bg-white/90 focus:ring-4 focus:ring-[var(--primary)]/10 transition-all shadow-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-3.5 px-5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-base font-semibold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer border-none outline-none mt-2"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        {/* Footer Section */}
        <p className="text-center mt-8 text-[14.5px] text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[var(--primary)] font-bold no-underline hover:text-[var(--primary-soft)] transition-colors hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
