import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import VideoCard from '../../components/VideoCard/VideoCard';
import { HiOutlineThumbUp } from 'react-icons/hi';

export default function LikedVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/likes/videos');
        setVideos((data.data || []).map(item => item.likedVideo || item));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page-container">
      <motion.h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineThumbUp /> Liked <span className="text-gradient">Videos</span>
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
          <div className="empty-state-icon">💜</div>
          <h3>No liked videos</h3>
          <p>Videos you like will appear here</p>
        </div>
      )}
    </div>
  );
}
