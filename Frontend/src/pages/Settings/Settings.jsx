import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCog, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhotograph } from 'react-icons/hi';


export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.patch('/users/update-account', profileData);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/users/change-password', passwordData);
      setPasswordData({ oldPassword: '', newPassword: '' });
      toast.success('Password changed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleAvatarUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await API.patch('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.data);
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update avatar');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-white/90 mb-8"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineCog /> <span className="text-teal-gradient">Settings</span>
      </motion.h1>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-[220px] lg:w-[260px] shrink-0 overflow-x-auto pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'profile', icon: <HiOutlineUser className="text-[20px]" />, label: 'Profile' },
            { id: 'password', icon: <HiOutlineLockClosed className="text-[20px]" />, label: 'Password' },
          ].map(tab => (
            <button key={tab.id} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[14.5px] transition-all cursor-pointer whitespace-nowrap bg-transparent border-none outline-none ${activeTab === tab.id ? 'bg-teal-primary/10 text-teal-soft shadow-[inset_0_-3px_0_#1DB8A8] md:shadow-[inset_3px_0_0_#1DB8A8]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full bg-bg-surface border border-white/10 p-6 md:p-8 rounded-2xl glass-card">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-[20px] font-light text-white/90 mb-6 m-0 border-b border-white/10 pb-4">Profile Settings</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 p-5 bg-white/[0.02] rounded-xl border border-white/5">
                <img src={user?.avatar} alt="" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-bg-base shadow-lg" />
                <label htmlFor="settings-avatar" className="btn-ghost !py-2 !px-4 flex items-center gap-2 cursor-pointer border-white/10 text-sm">
                  <HiOutlinePhotograph /> Change Avatar
                </label>
                <input id="settings-avatar" type="file" accept="image/*" onChange={handleAvatarUpdate} hidden />
              </div>
              <form onSubmit={handleProfileUpdate} className="flex flex-col gap-5 max-w-[500px]">
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-white/70 [&>label]:ml-1">
                  <label>Full Name</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-white/90 focus:outline-none focus:border-teal-primary transition-colors" value={profileData.fullName}
                    onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-white/70 [&>label]:ml-1">
                  <label>Email</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-white/90 focus:outline-none focus:border-teal-primary transition-colors" type="email" value={profileData.email}
                    onChange={e => setProfileData({...profileData, email: e.target.value})} />
                </div>
                <motion.button type="submit" className="btn-primary w-full md:w-auto mt-2 px-6 py-3 cursor-pointer outline-none border-none text-[15px]" disabled={loading}
                  whileTap={{ scale: 0.95 }}>
                  {loading ? <span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin inline-block" /> : 'Save Changes'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-[20px] font-light text-white/90 mb-6 m-0 border-b border-white/10 pb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-5 max-w-[500px]">
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-white/70 [&>label]:ml-1">
                  <label>Current Password</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-white/90 focus:outline-none focus:border-teal-primary transition-colors" type="password" value={passwordData.oldPassword}
                    onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-white/70 [&>label]:ml-1">
                  <label>New Password</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-white/90 focus:outline-none focus:border-teal-primary transition-colors" type="password" value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                </div>
                <motion.button type="submit" className="btn-primary w-full md:w-auto mt-2 px-6 py-3 cursor-pointer outline-none border-none text-[15px]" disabled={loading}
                  whileTap={{ scale: 0.95 }}>
                  {loading ? <span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin inline-block" /> : 'Update Password'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
