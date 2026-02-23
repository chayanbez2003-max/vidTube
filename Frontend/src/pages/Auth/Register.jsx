import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineVideoCamera, HiOutlinePhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avatar) {
      toast.error('Avatar image is required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', formData.fullName);
      fd.append('username', formData.username);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('avatar', avatar);
      if (coverImage) fd.append('coverImage', coverImage);

      await register(fd);
      toast.success('Account created! Please sign in 🎉');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
        className="auth-card glass-card auth-card-wide"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineVideoCamera />
          </div>
          <h1>Create Account</h1>
          <p>Join <span className="text-gradient">VidTube</span> and start sharing</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="avatar-upload">
            <label htmlFor="avatar-input" className="avatar-upload-label">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  <HiOutlinePhotograph />
                  <span>Avatar *</span>
                </div>
              )}
            </label>
            <input type="file" id="avatar-input" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <div className="auth-form-grid">
            <div className="input-group">
              <label htmlFor="reg-fullname">Full Name</label>
              <div className="input-with-icon">
                <HiOutlineUser className="input-icon" />
                <input id="reg-fullname" type="text" className="input-field" placeholder="Your full name"
                  value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="reg-username">Username</label>
              <div className="input-with-icon">
                <span className="input-icon">@</span>
                <input id="reg-username" type="text" className="input-field" placeholder="Choose a username"
                  value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-with-icon">
              <HiOutlineMail className="input-icon" />
              <input id="reg-email" type="email" className="input-field" placeholder="your@email.com"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input id="reg-password" type="password" className="input-field" placeholder="Create a strong password"
                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="cover-input">Cover Image (optional)</label>
            <input id="cover-input" type="file" accept="image/*" className="input-field file-input"
              onChange={(e) => setCoverImage(e.target.files[0])} />
          </div>

          <motion.button type="submit" className="btn btn-primary auth-submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </motion.button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
