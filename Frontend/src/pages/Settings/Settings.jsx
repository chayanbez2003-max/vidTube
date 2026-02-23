import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCog, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhotograph } from 'react-icons/hi';
import './Settings.css';

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
      toast.error('Failed to update avatar');
    }
  };

  return (
    <div className="page-container">
      <motion.h1 className="page-title" style={{ marginBottom: 28 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineCog /> <span className="text-gradient">Settings</span>
      </motion.h1>

      <div className="settings-layout">
        <div className="settings-tabs">
          {[
            { id: 'profile', icon: <HiOutlineUser />, label: 'Profile' },
            { id: 'password', icon: <HiOutlineLockClosed />, label: 'Password' },
          ].map(tab => (
            <button key={tab.id} 
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content glass-card">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="settings-section-title">Profile Settings</h2>
              <div className="settings-avatar-section">
                <img src={user?.avatar} alt="" className="avatar avatar-2xl" />
                <label htmlFor="settings-avatar" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <HiOutlinePhotograph /> Change Avatar
                </label>
                <input id="settings-avatar" type="file" accept="image/*" onChange={handleAvatarUpdate} hidden />
              </div>
              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="input-group">
                  <label>Full Name</label>
                  <input className="input-field" value={profileData.fullName}
                    onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input className="input-field" type="email" value={profileData.email}
                    onChange={e => setProfileData({...profileData, email: e.target.value})} />
                </div>
                <motion.button type="submit" className="btn btn-primary" disabled={loading}
                  whileTap={{ scale: 0.95 }}>
                  {loading ? <span className="spinner" /> : 'Save Changes'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="settings-section-title">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="input-group">
                  <label>Current Password</label>
                  <input className="input-field" type="password" value={passwordData.oldPassword}
                    onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>New Password</label>
                  <input className="input-field" type="password" value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                </div>
                <motion.button type="submit" className="btn btn-primary" disabled={loading}
                  whileTap={{ scale: 0.95 }}>
                  {loading ? <span className="spinner" /> : 'Update Password'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
