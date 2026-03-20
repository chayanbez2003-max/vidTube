import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome, HiOutlineFire, HiOutlineFolderOpen,
  HiOutlineThumbUp, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineStatusOnline
} from 'react-icons/hi';
import './Sidebar.css';

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user } = useAuth();

  const mainNav = [
    { to: '/', icon: <HiOutlineHome />, label: 'Home' },
    { to: '/trending', icon: <HiOutlineFire />, label: 'Trending' },
    { to: '/subscriptions', icon: <HiOutlineUserGroup />, label: 'Subscriptions' },
    { to: '/live', icon: <HiOutlineStatusOnline />, label: 'Live' },
  ];

  const libraryNav = [
    { to: '/history', icon: <HiOutlineClock />, label: 'History' },
    { to: '/liked-videos', icon: <HiOutlineThumbUp />, label: 'Liked Videos' },
    { to: '/playlists', icon: <HiOutlineFolderOpen />, label: 'Playlists' },
    { to: '/tweets', icon: <HiOutlineChatAlt2 />, label: 'Tweets' },
    { to: '/dashboard', icon: <HiOutlineChartBar />, label: 'Dashboard' },
  ];

  const navContent = (
    <nav className="sidebar-nav">
      <div className="nav-section">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
            title={item.label}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="nav-divider" />

      {user && (
        <div className="nav-section">
          {!collapsed && <p className="nav-section-title">Library</p>}
          {libraryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="sidebar-footer">
          <p>© 2026 VidTube</p>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar — animated width */}
      <motion.aside
        className={`sidebar sidebar-desktop ${collapsed ? 'collapsed' : ''}`}
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {navContent}
      </motion.aside>

      {/* Mobile sidebar — slide in drawer */}
      <motion.aside
        className="sidebar sidebar-mobile"
        initial={false}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {navContent}
      </motion.aside>
    </>
  );
}
