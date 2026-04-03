import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VideoPlayer from './pages/VideoPlayer/VideoPlayer';
import Upload from './pages/Upload/Upload';
import Channel from './pages/Channel/Channel';
import History from './pages/History/History';
import LikedVideos from './pages/LikedVideos/LikedVideos';
import Playlists from './pages/Playlists/Playlists';
import Playlist from './pages/Playlist/Playlist';
import Tweets from './pages/Tweets/Tweets';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Settings from './pages/Settings/Settings';
import Dashboard from './pages/Dashboard/Dashboard';
import GoLive from './pages/LiveStream/GoLive';
import WatchStream from './pages/LiveStream/WatchStream';
import LiveStreams from './pages/LiveStream/LiveStreams';
import { SocketProvider } from './context/SocketContext';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // close drawer when going desktop
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleToggle = () => {
    if (isMobile) setMobileOpen(prev => !prev);
    else setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary font-sans">
      <Header onToggleSidebar={handleToggle} />
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className={`flex-1 pt-16 min-h-[100vh] transition-all duration-300 ${!isMobile ? (sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]') : 'w-full'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:videoId" element={<VideoPlayer />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/trending" element={<Home />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/liked-videos" element={<ProtectedRoute><LikedVideos /></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
          <Route path="/playlist/:playlistId" element={<ProtectedRoute><Playlist /></ProtectedRoute>} />
          <Route path="/tweets" element={<ProtectedRoute><Tweets /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/live" element={<LiveStreams />} />
          <Route path="/go-live" element={<ProtectedRoute><GoLive /></ProtectedRoute>} />
          <Route path="/stream/:streamId" element={<WatchStream />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthLayout() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              boxShadow: '0 8px 40px rgba(var(--bg-rgb),0.65)',
            },
          }}
        />
        <AppRouter />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
