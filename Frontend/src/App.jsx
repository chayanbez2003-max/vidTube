import { useState } from 'react';
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

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:videoId" element={<VideoPlayer />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/trending" element={<Home />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/liked-videos" element={<ProtectedRoute><LikedVideos /></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
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
              background: '#1e1e2e',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <AppRouter />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
