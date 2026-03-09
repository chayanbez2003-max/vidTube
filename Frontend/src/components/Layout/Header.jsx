import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  HiOutlineSearch, HiOutlineBell, HiOutlineVideoCamera,
  HiOutlineLogout, HiOutlineUser, HiOutlineCog, HiOutlinePlay,
  HiOutlineThumbUp, HiOutlineUserAdd, HiOutlineChatAlt2,
  HiOutlineUpload, HiOutlineCheck, HiOutlineTrash, HiOutlineChartBar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/formatters';
import './Header.css';



const NOTIF_ICONS = {
  like: <HiOutlineThumbUp />,
  comment: <HiOutlineChatAlt2 />,
  subscribe: <HiOutlineUserAdd />,
  upload: <HiOutlineUpload />,
};

const NOTIF_ICON_CLASS = {
  like: 'notif-icon-like',
  comment: 'notif-icon-comment',
  subscribe: 'notif-icon-sub',
  upload: 'notif-icon-upload',
};

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==================== DYNAMIC SEARCH ====================

  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await API.get('/video', {
        params: { query: query.trim(), limit: 6, page: 1 }
      });
      const results = data?.data?.docs || data?.data || [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      setSuggestions([]);
    }
    setSearchLoading(false);
  }, []);

  // Sync search input with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('query');
    if (q !== null) {
      setSearchQuery(q);
    } else {
      setSearchQuery('');
    }
  }, [location.search]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(e);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        navigate(`/video/${suggestions[selectedIndex]._id}`);
        setShowSuggestions(false);
        setSearchQuery('');
      } else {
        handleSearch(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      if (location.search || location.pathname !== '/') {
        navigate('/');
      }
    }
  };

  const handleSuggestionClick = (videoId) => {
    navigate(`/video/${videoId}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (location.pathname === '/') {
      navigate('/');
    }
  };

  // ==================== NOTIFICATIONS (Real Backend API) ====================

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await API.get('/notifications/unread');
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (e) { /* ignore - user might not be logged in */ }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const { data } = await API.get('/notifications', { params: { limit: 15 } });
      setNotifications(data.data?.notifications || []);
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
    setNotifLoading(false);
  };

  const handleNotifToggle = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await API.delete('/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotifClick = async (notif) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await API.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
      } catch (e) { /* ignore */ }
    }

    // Navigate based on type
    setShowNotifications(false);
    if (notif.video?._id) {
      navigate(`/video/${notif.video._id}`);
    } else if (notif.type === 'subscribe' && notif.sender?.username) {
      navigate(`/channel/${notif.sender.username}`);
    }
  };

  // ==================== AUTH ====================

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // ==================== RENDER ====================

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} id="sidebar-toggle">
          <span></span><span></span><span></span>
        </button>
        <Link to="/" className="logo" id="logo-link">
          <div className="logo-icon">
            <HiOutlineVideoCamera />
          </div>
          <span className="logo-text">
            Vid<span className="text-gradient">Tube</span>
          </span>
        </Link>
      </div>

      {/* Dynamic Search Bar */}
      <div className="search-wrapper" ref={searchRef}>
        <form className={`search-bar ${searchFocused ? 'focused' : ''}`} onSubmit={handleSearch}>
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              setSearchFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleSearchKeyDown}
            id="search-input"
          />
          {searchLoading && <span className="search-spinner" />}
          {searchQuery && !searchLoading && (
            <button type="button" className="search-clear" onClick={handleClearSearch}>✕</button>
          )}
        </form>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="search-suggestions"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {suggestions.map((video, idx) => (
                <button
                  key={video._id}
                  className={`suggestion-item ${selectedIndex === idx ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(video._id);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="suggestion-thumb">
                    <img src={video.thumbnail?.url || video.thumbnail} alt="" />
                    <HiOutlinePlay className="suggestion-play" />
                  </div>
                  <div className="suggestion-info">
                    <p className="suggestion-title">{video.title}</p>
                    <p className="suggestion-meta">
                      {video.ownerDetails?.username || video.owner?.username || 'Unknown'}
                      {video.views !== undefined && ` ${video.views} views`}
                    </p>
                  </div>
                </button>
              ))}
              <button
                className="suggestion-more"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearch(e);
                }}
              >
                <HiOutlineSearch /> See all results for "{searchQuery}"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="header-right">
        {user ? (
          <>
            <Link to="/upload" className="btn btn-primary upload-btn" id="upload-btn">
              <HiOutlineVideoCamera />
              <span>Upload</span>
            </Link>

            {/* Dynamic Notifications (Backend API) */}
            <div className="notification-wrapper" ref={notifRef}>
              <button
                className="btn-icon notification-btn"
                id="notification-btn"
                onClick={handleNotifToggle}
              >
                <HiOutlineBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="notification-panel"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="notif-header">
                      <h3>Notifications</h3>
                      <div className="notif-header-actions">
                        {notifications.some(n => !n.isRead) && (
                          <button className="notif-action-btn" onClick={handleMarkAllRead} title="Mark all as read">
                            <HiOutlineCheck /> Read all
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button className="notif-action-btn notif-action-danger" onClick={handleClearAll} title="Clear all">
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notif-list">
                      {notifLoading ? (
                        <div className="notif-loading">
                          <span className="search-spinner" style={{ width: 24, height: 24 }} />
                          <p>Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif, i) => (
                          <motion.div
                            key={notif._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <button
                              className={`notif-item ${!notif.isRead ? 'notif-unread' : ''}`}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <div className="notif-sender-avatar">
                                {notif.sender?.avatar?.url ? (
                                  <img src={notif.sender.avatar.url} alt="" />
                                ) : (
                                  <div className={`notif-icon ${NOTIF_ICON_CLASS[notif.type] || ''}`}>
                                    {NOTIF_ICONS[notif.type] || <HiOutlineBell />}
                                  </div>
                                )}
                              </div>
                              <div className="notif-content">
                                <p className="notif-message">{notif.message}</p>
                                <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                              </div>
                              {notif.video?.thumbnail?.url && (
                                <div className="notif-thumb">
                                  <img src={notif.video.thumbnail.url} alt="" />
                                </div>
                              )}
                              {!notif.isRead && <span className="notif-unread-dot" />}
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="notif-empty">
                          <HiOutlineBell />
                          <p>No notifications yet</p>
                          <span>When someone likes, comments or subscribes, you'll see it here</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                id="user-menu-btn"
              >
                <img src={user.avatar} alt={user.username} className="avatar" />
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="dropdown-header">
                      <img src={user.avatar} alt="" className="avatar avatar-lg" />
                      <div>
                        <p className="dropdown-name">{user.fullName}</p>
                        <p className="dropdown-username">@{user.username}</p>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to={`/channel/${user.username}`} className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <HiOutlineUser /> Your Channel
                    </Link>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <HiOutlineChartBar /> Dashboard
                    </Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <HiOutlineCog /> Settings
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                      <HiOutlineLogout /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-ghost" id="login-btn">Sign In</Link>
            <Link to="/register" className="btn btn-primary" id="register-btn">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
