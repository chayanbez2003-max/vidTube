import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  HiOutlineHome, HiOutlineFire, HiOutlineFolderOpen,
  HiOutlineThumbUp, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineStatusOnline
} from 'react-icons/hi';
import './Sidebar.css';

export default function Sidebar({ collapsed }) {
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

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <nav className="sidebar-nav">
        <div className="nav-section">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
              title={item.label}
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
    </motion.aside>
  );
}
