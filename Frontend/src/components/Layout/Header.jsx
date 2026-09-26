import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  HiOutlineSearch, HiOutlineBell, HiOutlineVideoCamera,
  HiOutlineLogout, HiOutlineUser, HiOutlineCog, HiOutlinePlay,
  HiOutlineThumbUp, HiOutlineUserAdd, HiOutlineChatAlt2,
  HiOutlineUpload, HiOutlineCheck, HiOutlineTrash, HiOutlineChartBar,
  HiOutlineLogin
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
  subscribe: 'bg-slate-100 text-[var(--primary)]',
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
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-white border-b border-slate-200/80 flex items-center justify-between px-2.5 sm:px-4 md:px-5 z-[100] gap-1.5 sm:gap-3 md:gap-4">
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <button className="w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center gap-[4.5px] bg-transparent border-none cursor-pointer rounded-full transition-colors hover:bg-slate-100 shrink-0 group" onClick={onToggleSidebar} aria-label="Toggle navigation">
          <span className="block w-5 h-[2px] bg-slate-700 rounded-sm transition-all" />
          <span className="block w-5 h-[2px] bg-slate-700 rounded-sm transition-all" />
          <span className="block w-5 h-[2px] bg-slate-700 rounded-sm transition-all" />
        </button>
        <Link to="/" className="flex items-center gap-2 text-slate-900 no-underline group py-1 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 flex items-center justify-center text-[18px] sm:text-[20px] text-white shadow-sm transition-transform group-hover:scale-105 shrink-0">
            <HiOutlineVideoCamera />
          </div>
          <span className="text-xl font-bold tracking-tight hidden md:block text-slate-900">
            Vid<span className="text-sky-600 font-bold">Tube</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-[560px] min-w-0 relative mx-1 sm:mx-2" ref={searchRef}>
        <form className="relative flex items-center group w-full" onSubmit={handleSearch}>
          <HiOutlineSearch className={`absolute left-2.5 sm:left-3.5 text-[17px] pointer-events-none transition-colors ${searchFocused ? 'text-sky-600' : 'text-slate-400'}`} />
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
            className="w-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-7 sm:pr-8 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-full text-slate-800 text-xs sm:text-sm outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-400 shadow-sm"
          />
          {searchLoading && <span className="absolute right-2.5 sm:right-3 w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />}
          {searchQuery && !searchLoading && (
            <button type="button" className="absolute right-2.5 sm:right-3 text-slate-400 text-xs sm:text-sm hover:text-slate-600" onClick={handleClearSearch}>✕</button>
          )}
        </form>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[300]"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            >
              {suggestions.map((video, idx) => (
                <button
                  key={video._id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 w-full bg-transparent border-none text-slate-800 hover:bg-slate-100 text-left cursor-pointer transition-colors ${selectedIndex === idx ? 'bg-slate-100' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(video._id); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="w-16 h-9 rounded-md overflow-hidden shrink-0 relative bg-slate-100 group/thumb">
                    <img src={video.thumbnail?.url || video.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm transition-opacity opacity-0 group-hover/thumb:opacity-100 ${selectedIndex === idx ? '!opacity-100' : ''}`}>
                      <HiOutlinePlay />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate mb-0.5 text-slate-900">{video.title}</p>
                    <p className="text-[11px] text-slate-500 capitalize truncate">
                      {video.ownerDetails?.username || video.owner?.username || 'Unknown'}
                      {video.views !== undefined && ` • ${video.views} views`}
                    </p>
                  </div>
                </button>
              ))}
              <button
                className="flex items-center justify-center gap-1.5 p-3 w-full bg-slate-50 border-t border-slate-100 text-sky-600 text-[13px] font-semibold cursor-pointer transition-colors hover:bg-slate-100"
                onMouseDown={(e) => { e.preventDefault(); handleSearch(e); }}
              >
                <HiOutlineSearch /> See all results for "{searchQuery}"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 justify-end shrink-0">
        {user ? (
          <>
            {/* Upload Button: hidden on mobile (<sm), uses distinct upload icon on sm+ */}
            <Link
              to="/upload"
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white transition-all duration-200 no-underline font-semibold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm hover:shadow-md shrink-0"
              title="Upload Video"
            >
              <HiOutlineUpload className="text-[17px] sm:text-[18px]" />
              <span className="hidden md:inline">Upload</span>
            </Link>

            <div className="relative shrink-0" ref={notifRef}>
              <button
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-sky-600 transition-all cursor-pointer relative shadow-sm shrink-0"
                onClick={handleNotifToggle}
                title="Notifications"
                aria-label="Notifications"
              >
                <HiOutlineBell className="text-lg sm:text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md shadow-rose-500/30">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="absolute top-[calc(100%+10px)] right-[-50px] sm:right-0 w-[calc(100vw-24px)] max-w-[340px] sm:max-w-[420px] max-h-[520px] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden z-[300] flex flex-col"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center justify-between p-3.5 px-4.5 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-[15px] font-bold text-slate-900 m-0">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {notifications.some(n => !n.isRead) && (
                          <button className="flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-600 text-[11px] font-semibold cursor-pointer px-2.5 py-1 rounded-lg transition-colors hover:bg-sky-100" onClick={handleMarkAllRead}>
                            <HiOutlineCheck /> Read all
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button className="flex items-center justify-center p-1.5 bg-transparent border-none text-slate-400 text-[14px] cursor-pointer rounded-lg transition-colors hover:text-rose-600 hover:bg-rose-50" onClick={handleClearAll} title="Clear all">
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {notifLoading ? (
                        <div className="flex flex-col items-center gap-3 p-10 text-slate-500 text-[13px]">
                          <span className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
                          <p>Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif, i) => (
                          <motion.div key={notif._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                            <button
                              className={`flex items-start gap-3.5 p-3.5 px-4 w-full text-left border-none cursor-pointer transition-colors relative ${
                                !notif.isRead
                                  ? 'bg-sky-50/70 hover:bg-sky-100/80 border-l-[3.5px] border-l-sky-500'
                                  : 'bg-white hover:bg-slate-50 border-l-[3.5px] border-l-transparent'
                              }`}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm">
                                {notif.sender?.avatar?.url ? (
                                  <img src={notif.sender.avatar.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0 ${NOTIF_ICON_CLASS[notif.type] || 'bg-sky-100 text-sky-600'}`}>
                                    {NOTIF_ICONS[notif.type] || <HiOutlineBell />}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] line-clamp-2 leading-snug m-0 ${!notif.isRead ? 'text-slate-900 font-semibold' : 'text-slate-600 font-normal'}`}>
                                  {notif.message}
                                </p>
                                <span className="block mt-1 text-[11px] text-slate-400 font-medium">{timeAgo(notif.createdAt)}</span>
                              </div>
                              {notif.video?.thumbnail?.url && (
                                <div className="w-[52px] h-[32px] rounded-md shrink-0 overflow-hidden border border-slate-200">
                                  <img src={notif.video.thumbnail.url} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {!notif.isRead && <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />}
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-10 px-5 text-slate-400 text-center">
                          <HiOutlineBell className="text-[34px] mb-1 opacity-60 text-slate-400" />
                          <p className="text-[14px] font-medium text-slate-700 m-0">No notifications yet</p>
                          <span className="text-[12px] text-slate-400">When someone likes, comments or subscribes, you'll see it here</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                className="bg-transparent border-none cursor-pointer p-0 rounded-full transition-all ring-2 ring-transparent hover:ring-sky-400 focus:ring-sky-400 shadow-sm shrink-0 flex items-center justify-center"
                onClick={() => setShowDropdown(!showDropdown)}
                title="Account menu"
                aria-label="Account menu"
              >
                <img src={user.avatar} alt={user.fullName || user.username} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shrink-0 block" />
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute top-[calc(100%+10px)] right-0 w-[270px] max-w-[calc(100vw-20px)] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden z-[300]"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-100">
                      <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-sky-500/20 shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[14.5px] text-slate-900 capitalize m-0 truncate">{user.fullName}</p>
                        <p className="text-[12.5px] text-sky-600 font-medium m-0 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link to={`/channel/${user.username}`} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 text-[14px] font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowDropdown(false)}>
                        <HiOutlineUser className="text-[19px] text-sky-500" /> Your Channel
                      </Link>
                      <Link to="/upload" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 text-[14px] font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowDropdown(false)}>
                        <HiOutlineUpload className="text-[19px] text-emerald-500" /> Upload Video
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 text-[14px] font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowDropdown(false)}>
                        <HiOutlineChartBar className="text-[19px] text-indigo-500" /> Dashboard
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 text-[14px] font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowDropdown(false)}>
                        <HiOutlineCog className="text-[19px] text-amber-500" /> Settings
                      </Link>
                      <div className="h-[1px] bg-slate-100 my-1" />
                      <button className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-700 text-[14px] font-medium bg-transparent border-none cursor-pointer transition-colors hover:bg-rose-50 hover:text-rose-600 text-left" onClick={handleLogout}>
                        <HiOutlineLogout className="text-[19px] text-rose-500" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-semibold text-sky-600 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/40 hover:border-sky-500 shadow-sm hover:shadow-[0_0_16px_rgba(14,165,233,0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 no-underline shrink-0"
            >
              <HiOutlineLogin className="text-sm sm:text-base md:text-lg text-sky-500" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-400 hover:via-indigo-500 hover:to-violet-500 shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_22px_rgba(139,92,246,0.55)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 no-underline shrink-0"
            >
              <HiOutlineUserAdd className="text-sm sm:text-base md:text-lg text-white/90" />
              <span>Sign Up</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}