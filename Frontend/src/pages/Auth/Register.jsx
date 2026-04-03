import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineVideoCamera, HiOutlinePhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';

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
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', formData.fullName);
      fd.append('username', formData.username);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      if (avatar) fd.append('avatar', avatar);
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
    <div className="min-h-screen flex items-center justify-center py-10 px-5 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[400px] h-[400px] bg-teal-primary -top-[100px] -right-[100px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[300px] h-[300px] bg-sky-top -bottom-[80px] -left-[80px] animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[200px] h-[200px] bg-badge-pink top-[40%] left-[60%] animate-[float_6s_ease-in-out_infinite]" />
      </div>

      <motion.div
        className="w-full p-7 sm:p-10 relative z-10 glass-card max-w-[500px]"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-primary to-teal-soft flex items-center justify-center text-[28px] text-[#051a18] mx-auto mb-4 shadow-[0_4px_20px_rgba(29,184,168,0.3)]">
            <HiOutlineVideoCamera />
          </div>
          <h1 className="text-[26px] font-light mb-1.5">Create Account</h1>
          <p className="text-[var(--text-secondary)] text-sm">Join <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">VidTube</span> and start sharing</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <div className="flex justify-center">
            <label htmlFor="avatar-input" className="w-[100px] h-[100px] rounded-full border-2 border-dashed border-teal-dim flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 hover:border-teal-soft hover:shadow-[0_4px_20px_rgba(29,184,168,0.3)]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[var(--text-muted)] text-[12px] [&>svg]:text-[24px]">
                  <HiOutlinePhotograph />
                  <span>Avatar (optional)</span>
                </div>
              )}
            </label>
            <input type="file" id="avatar-input" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
              <label htmlFor="reg-fullname">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px] flex items-center" />
                <input id="reg-fullname" type="text" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="Your full name"
                  value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
              <label htmlFor="reg-username">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px] flex items-center">@</span>
                <input id="reg-username" type="text" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="Choose a username"
                  value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
            <label htmlFor="reg-email">Email</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px] flex items-center" />
              <input id="reg-email" type="email" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="your@email.com"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
            <label htmlFor="reg-password">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px] flex items-center" />
              <input id="reg-password" type="password" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 pl-[46px] text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="Create a strong password"
                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
            <label htmlFor="cover-input">Cover Image (optional)</label>
            <input id="cover-input" type="file" accept="image/*" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl p-2.5 file:bg-teal-primary file:text-[#051a18] file:border-none file:px-3.5 file:py-1.5 file:rounded-md file:font-semibold file:cursor-pointer file:mr-2.5 text-[var(--text-secondary)] text-sm focus:outline-none focus:border-teal-primary transition-colors"
              onChange={(e) => setCoverImage(e.target.files[0])} />
          </div>

          <motion.button type="submit" className="btn-primary w-full justify-center p-[14px] text-[15px] mt-1 border-none cursor-pointer outline-none" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? <span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" /> : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-[14px] text-[var(--text-secondary)]">
          Already have an account? <Link to="/login" className="text-[var(--primary-soft)] font-semibold no-underline hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
