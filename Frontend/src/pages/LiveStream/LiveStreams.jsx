import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineStatusOnline, HiOutlineEye, HiOutlineVideoCamera
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './LiveStream.css';

export default function LiveStreams() {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data } = await API.get('/streams/live');
      setStreams(data.data?.streams || []);
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="live-page-header">
        <div className="live-page-title">
          <HiOutlineStatusOnline className="live-page-icon" />
          <h1>Live <span className="text-gradient">Streams</span></h1>
        </div>
        {user && (
          <Link to="/go-live" className="btn btn-primary">
            <HiOutlineVideoCamera /> Go Live
          </Link>
        )}
      </div>

      {loading ? (
        <div className="live-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-thumb" />
              <div className="skeleton-info">
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton-meta">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-sub" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : streams.length > 0 ? (
        <div className="live-grid">
          {streams.map((stream, index) => (
            <motion.div
              key={stream._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={`/stream/${stream._id}`} className="live-card">
                <div className="live-card-thumb">
                  <div className="live-card-preview">
                    <div className="stream-wave-animation small">
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <div className="live-card-badge">
                    <span className="live-badge-dot" />
                    LIVE
                  </div>
                  <div className="live-card-viewers">
                    <HiOutlineEye /> {stream.viewers || 0}
                  </div>
                </div>
                <div className="live-card-info">
                  <img
                    src={stream.streamer?.avatar?.url || stream.streamer?.avatar || '/default-avatar.png'}
                    alt=""
                    className="avatar"
                  />
                  <div className="live-card-meta">
                    <h3 className="live-card-title">{stream.title}</h3>
                    <p className="live-card-streamer">
                      {stream.streamer?.fullName || stream.streamer?.username}
                    </p>
                    <div className="live-card-tags">
                      <span className="badge badge-accent" style={{ fontSize: 10, padding: '2px 6px' }}>
                        {stream.category}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <h3>No live streams right now</h3>
          <p>Be the first to go live!</p>
          {user && (
            <Link to="/go-live" className="btn btn-primary" style={{ marginTop: 16 }}>
              <HiOutlineVideoCamera /> Start Streaming
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
