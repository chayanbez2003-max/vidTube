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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-[var(--text-primary)] mb-6"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineThumbUp className="text-[var(--primary)]" /> Liked <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">Videos</span>
      </motion.h1>
      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3"><div className="w-full aspect-video rounded-xl bg-[var(--glass-border)] animate-pulse" /></div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="video-grid">
          {videos.map((v, i) => <VideoCard key={v._id || i} video={v} index={i} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] mb-4 opacity-50">💜</div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No liked videos</h3>
          <p className="text-sm text-[var(--text-muted)]">Videos you like will appear here</p>
        </div>
      )}
    </div>
  );
}
