import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Header from './components/Layout/Header.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import Home from './pages/Home/Home.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="app-layout">
      <Header onToggleSidebar={handleToggle} />
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className={`main-content ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
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
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              boxShadow: '0 8px 40px rgba(var(--bg-rgb),0.2)',
            },
            success: {
              style: {
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#065F46',
              },
              iconTheme: { primary: '#10B981', secondary: '#ffffff' },
            },
            error: {
              style: {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#991B1B',
              },
              iconTheme: { primary: '#EF4444', secondary: '#ffffff' },
            },
          }}
        />
        <AppRouter />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}