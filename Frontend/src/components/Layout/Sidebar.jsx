import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome, HiOutlineFire, HiOutlineFolderOpen,
  HiOutlineThumbUp, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineChatAlt2, HiOutlineChartBar, HiOutlineStatusOnline
} from "react-icons/hi";

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
    <nav className="p-3 flex flex-col h-full relative z-10">
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14px] transition-all whitespace-nowrap relative overflow-hidden ${
                isActive
                  ? 'bg-violet-100 text-violet-700 font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] border border-transparent'
              } ${collapsed ? 'justify-center !px-3' : ''}`
            }
            end={item.to === '/'}
            title={item.label}
            onClick={onClose}
          >
            <span className="text-[20px] flex items-center shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="mx-3 my-2 border-t border-[var(--glass-border)]" />

      {user && (
        <div className="flex flex-col gap-0.5">
          {!collapsed && <p className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[1px] text-[var(--text-muted)]">Library</p>}
          {libraryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14px] transition-all whitespace-nowrap relative overflow-hidden ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] border border-transparent'
                } ${collapsed ? 'justify-center !px-3' : ''}`
              }
              title={item.label}
              onClick={onClose}
            >
              <span className="text-[20px] flex items-center shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="mt-auto p-4 text-center text-[11px] text-[var(--text-muted)] leading-relaxed">
          <p>© 2026 VidTube</p>
        </div>
      )}
    </nav>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-[4px] z-[199]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="hidden md:flex flex-col fixed top-[var(--header-height)] left-0 bottom-0 bg-[var(--bg-primary)] border-r border-[var(--border-color)] z-[200]"
        initial={false}
        animate={{ width: collapsed ? 72 : 250 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {navContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            className="md:hidden flex flex-col fixed top-[var(--header-height)] left-0 bottom-0 w-[250px] bg-[var(--bg-primary)] border-r border-[var(--border-color)] z-[200]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {navContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
