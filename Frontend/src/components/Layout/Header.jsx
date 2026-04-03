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

const NOTIF_ICONS = {
  like: <HiOutlineThumbUp />,
  comment: <HiOutlineChatAlt2 />,
  subscribe: <HiOutlineUserAdd />,
  upload: <HiOutlineUpload />,
};

const NOTIF_ICON_CLASS = {
  like: 'bg-[rgba(244,160,160,0.12)] text-badge-pink',
  comment: 'bg-[rgba(160,244,192,0.12)] text-badge-green',
  subscribe: 'bg-teal-mist text-teal-soft',
  upload: 'bg-[rgba(160,196,244,0.12)] text-badge-blue',
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await API.get('/video', { params: { query: query.trim(), limit: 6, page: 1 } });
      const results = data?.data?.docs || data?.data || [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      setSuggestions([]);
    }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('query');
    setSearchQuery(q !== null ? q : '');
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
      } else handleSearch(e);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    else if (location.search || location.pathname !== '/') navigate('/');
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
    if (location.pathname === '/') navigate('/');
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await API.get('/notifications/unread');
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const { data } = await API.get('/notifications', { params: { limit: 15 } });
      setNotifications(data.data?.notifications || []);
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (err) {}
    setNotifLoading(false);
  };

  const handleNotifToggle = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { toast.error('Failed to mark as read'); }
  };

  const handleClearAll = async () => {
    try {
      await API.delete('/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (err) { toast.error('Failed to clear notifications'); }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await API.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      } catch (e) {}
    }
    setShowNotifications(false);
    if (notif.video?._id) navigate(`/video/${notif.video._id}`);
    else if (notif.type === 'subscribe' && notif.sender?.username) navigate(`/channel/${notif.sender.username}`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] glass-nav flex items-center justify-between px-5 z-[100] gap-4">
      <div className="flex items-center gap-3 min-w-[auto] md:min-w-[200px]">
        <button className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] bg-transparent border-none cursor-pointer rounded-full transition-colors hover:bg-white/5 group" onClick={onToggleSidebar}>
          <span className="block w-5 h-[2px] bg-[rgba(255,255,255,0.7)] rounded-sm transition-all" />
          <span className="block w-5 h-[2px] bg-[rgba(255,255,255,0.7)] rounded-sm transition-all" />
          <span className="block w-5 h-[2px] bg-[rgba(255,255,255,0.7)] rounded-sm transition-all" />
        </button>
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <div className="w-9 h-9 rounded-[10px] bg-[linear-gradient(135deg,#1DB8A8,#2ED4BC)] flex items-center justify-center text-xl text-[#051a18] drop-shadow-[0_0_8px_rgba(64,255,232,0.3)] transition-[filter] duration-300 hover:drop-shadow-[0_0_14px_rgba(64,255,232,0.55)]">
            <HiOutlineVideoCamera />
          </div>
          <span className="text-xl font-light tracking-[-0.02em] hidden md:block">
            Vid<span className="text-teal-gradient">Tube</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-[160px] md:max-w-[300px] lg:max-w-[600px] relative" ref={searchRef}>
        <form className="relative flex items-center group" onSubmit={handleSearch}>
          <HiOutlineSearch className={`absolute left-3.5 text-[18px] pointer-events-none transition-colors ${searchFocused ? 'text-teal-primary' : 'text-white/40'}`} />
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
            className="w-full py-2.5 pl-[42px] pr-10 bg-white/5 border border-white/10 rounded-full text-white text-sm outline-none transition-all focus:border-teal-dim focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(29,184,168,0.12)] placeholder:text-white/40"
          />
          {searchLoading && <span className="absolute right-3 w-4 h-4 border-2 border-[rgba(29,184,168,0.15)] border-t-[#1DB8A8] rounded-full animate-spin" />}
          {searchQuery && !searchLoading && (
            <button type="button" className="absolute right-3 text-white/50 text-sm hover:text-white" onClick={handleClearSearch}>✕</button>
          )}
        </form>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-bg-elevated border border-white/10 rounded-[var(--border-radius)] shadow-[0_16px_48px_rgba(13,11,24,0.7)] overflow-hidden z-[200] bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(205,184,232,0.04)_0%,transparent_70%)]"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            >
              {suggestions.map((video, idx) => (
                <button
                  key={video._id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 w-full bg-transparent border-none text-white text-left cursor-pointer transition-colors hover:bg-teal-mist ${selectedIndex === idx ? 'bg-teal-mist' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(video._id); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="w-16 h-9 rounded-md overflow-hidden shrink-0 relative bg-white/5 group/thumb">
                    <img src={video.thumbnail?.url || video.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 flex items-center justify-center bg-[rgba(13,11,24,0.4)] text-white text-sm transition-opacity opacity-0 group-hover/thumb:opacity-100 ${selectedIndex === idx ? '!opacity-100' : ''}`}>
                      <HiOutlinePlay />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate mb-0.5">{video.title}</p>
                    <p className="text-[11px] text-white/50 capitalize truncate">
                      {video.ownerDetails?.username || video.owner?.username || 'Unknown'}
                      {video.views !== undefined && ` • ${video.views} views`}
                    </p>
                  </div>
                </button>
              ))}
              <button
                className="flex items-center justify-center gap-1.5 p-3 w-full bg-transparent border-t border-white/10 text-teal-soft text-[13px] font-semibold cursor-pointer transition-colors hover:bg-teal-mist"
                onMouseDown={(e) => { e.preventDefault(); handleSearch(e); }}
              >
                <HiOutlineSearch /> See all results for "{searchQuery}"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2.5 justify-end min-w-[auto] md:min-w-[200px]">
        {user ? (
          <>
            <Link to="/upload" className="btn btn-primary !gap-1.5 md:!gap-2 flex">
              <HiOutlineVideoCamera className="text-lg" />
              <span className="hidden md:inline">Upload</span>
            </Link>

            <div className="relative" ref={notifRef}>
              <button className="btn-icon" onClick={handleNotifToggle}>
                <HiOutlineBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-teal-primary text-[#051a18] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--bg-base)] shadow-[0_0_6px_rgba(var(--primary-rgb),0.5)] animate-[pulse-glow_2s_ease-in-out_infinite]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="absolute top-[calc(100%+8px)] right-[-80px] md:right-[-40px] lg:right-0 w-[290px] md:w-[320px] lg:w-[400px] max-h-[520px] bg-bg-elevated border border-white/10 rounded-[var(--r-lg)] shadow-[0_24px_80px_rgba(13,11,24,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden z-[200] flex flex-col bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(142,197,214,0.04)_0%,transparent_70%)]"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center justify-between p-3.5 px-4 border-b border-white/10">
                      <h3 className="text-[15px] font-light tracking-[-0.01em] m-0">Notifications</h3>
                      <div className="flex items-center gap-1.5">
                        {notifications.some(n => !n.isRead) && (
                          <button className="flex items-center gap-1 bg-transparent border-none text-teal-soft text-[11px] font-semibold cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-teal-mist" onClick={handleMarkAllRead}>
                            <HiOutlineCheck /> Read all
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button className="flex items-center gap-1 bg-transparent border-none text-white/50 text-[13px] font-semibold cursor-pointer px-2 py-1 rounded-md transition-colors hover:text-badge-pink hover:bg-[rgba(244,160,160,0.08)]" onClick={handleClearAll}>
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifLoading ? (
                        <div className="flex flex-col items-center gap-3 p-10 text-white/50 text-[13px]">
                          <span className="w-6 h-6 border-2 border-[rgba(29,184,168,0.15)] border-t-[#1DB8A8] rounded-full animate-spin" />
                          <p>Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif, i) => (
                          <motion.div key={notif._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                            <button
                              className={`flex items-start gap-3 p-3 px-4 w-full text-left bg-transparent border-none cursor-pointer transition-colors relative hover:bg-white/5 ${!notif.isRead ? 'bg-teal-mist hover:bg-[rgba(29,184,168,0.12)]' : ''}`}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                {notif.sender?.avatar?.url ? (
                                  <img src={notif.sender.avatar.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0 ${NOTIF_ICON_CLASS[notif.type] || ''}`}>
                                    {NOTIF_ICONS[notif.type] || <HiOutlineBell />}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] line-clamp-2 leading-[1.4] m-0 ${!notif.isRead ? 'text-white font-medium' : 'text-white/70 font-normal'}`}>
                                  {notif.message}
                                </p>
                                <span className="block mt-1 text-[11px] text-white/50">{timeAgo(notif.createdAt)}</span>
                              </div>
                              {notif.video?.thumbnail?.url && (
                                <div className="w-[50px] h-[30px] rounded shrink-0 overflow-hidden">
                                  <img src={notif.video.thumbnail.url} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {!notif.isRead && <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-teal-primary shadow-[0_0_8px_rgba(64,255,232,0.4)]" />}
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-10 px-5 text-white/50 text-center">
                          <HiOutlineBell className="text-[32px] mb-1 opacity-50" />
                          <p className="text-[14px] text-white/70 m-0">No notifications yet</p>
                          <span className="text-[12px]">When someone likes, comments or subscribes, you'll see it here</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                className="bg-transparent border-none cursor-pointer p-0.5 rounded-full transition-all hover:shadow-[0_0_0_3px_rgba(29,184,168,0.3)]"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-bg-elevated border border-white/10 rounded-[var(--r-lg)] shadow-[0_24px_80px_rgba(13,11,24,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden z-[200] bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(205,184,232,0.04)_0%,transparent_70%)]"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[14px] capitalize m-0 truncate">{user.fullName}</p>
                        <p className="text-[13px] text-white/70 m-0 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <div className="h-[1px] bg-[var(--border-color)]" />
                    <Link to={`/channel/${user.username}`} className="flex items-center gap-2.5 px-4 py-3 text-white/70 text-[14px] no-underline transition-colors hover:bg-white/5 hover:text-white" onClick={() => setShowDropdown(false)}>
                      <HiOutlineUser className="text-[18px]" /> Your Channel
                    </Link>
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-3 text-white/70 text-[14px] no-underline transition-colors hover:bg-white/5 hover:text-white" onClick={() => setShowDropdown(false)}>
                      <HiOutlineChartBar className="text-[18px]" /> Dashboard
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2.5 px-4 py-3 text-white/70 text-[14px] no-underline transition-colors hover:bg-white/5 hover:text-white" onClick={() => setShowDropdown(false)}>
                      <HiOutlineCog className="text-[18px]" /> Settings
                    </Link>
                    <div className="h-[1px] bg-[var(--border-color)]" />
                    <button className="flex items-center gap-2.5 px-4 py-3 w-full text-white/70 text-[14px] bg-transparent border-none cursor-pointer transition-colors hover:bg-[rgba(244,160,160,0.08)] hover:text-badge-pink text-left" onClick={handleLogout}>
                      <HiOutlineLogout className="text-[18px]" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost px-3 py-1.5 text-sm md:px-5 md:py-2.5 md:text-base">Sign In</Link>
            <Link to="/register" className="btn btn-primary px-3 py-1.5 text-sm md:px-5 md:py-2.5 md:text-base">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
