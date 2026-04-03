import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import VideoCard from '../../components/VideoCard/VideoCard';
import { HiOutlineClock } from 'react-icons/hi';

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/history');
        setVideos(data.data || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page-container">
      <motion.h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineClock /> Watch <span className="text-gradient">History</span>
      </motion.h1>
      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card"><div className="skeleton skeleton-thumb" /></div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="video-grid">
          {videos.map((v, i) => <VideoCard key={v._id || i} video={v} index={i} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🕐</div>
          <h3>No watch history</h3>
          <p>Videos you watch will appear here</p>
        </div>
      )}
    </div>
  );
}
