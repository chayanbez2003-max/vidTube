import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineVideoCamera } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Auth.css';

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
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
      </div>
      
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineVideoCamera />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to <span className="text-gradient">VidTube</span></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="login-email">Email or Username</label>
            <div className="input-with-icon">
              <HiOutlineMail className="input-icon" />
              <input
                id="login-email"
                type="text"
                className="input-field"
                placeholder="Enter email or username"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}
