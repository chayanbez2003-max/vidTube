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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-white/90 mb-6"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineClock className="text-teal-primary" /> Watch <span className="text-teal-gradient">History</span>
      </motion.h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3"><div className="w-full aspect-video rounded-xl bg-white/5 animate-pulse" /></div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {videos.map((v, i) => <VideoCard key={v._id || i} video={v} index={i} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] mb-4 opacity-50">🕐</div>
          <h3 className="text-xl font-semibold mb-2 text-white/90">No watch history</h3>
          <p className="text-sm text-white/50">Videos you watch will appear here</p>
        </div>
      )}
    </div>
  );
}
