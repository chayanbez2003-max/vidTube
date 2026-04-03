import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineStatusOnline, HiOutlineEye, HiOutlineVideoCamera
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';


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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <HiOutlineStatusOnline className="text-[28px] text-live animate-pulse" />
          <h1 className="text-2xl md:text-[28px] font-light text-[var(--text-primary)] m-0">Live <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">Streams</span></h1>
        </div>
        {user && (
          <Link to="/go-live" className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 outline-none border-none cursor-pointer text-sm font-medium no-underline">
            <HiOutlineVideoCamera className="text-[18px]" /> Go Live
          </Link>
        )}
      </div>

      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 w-full">
              <div className="w-full aspect-video rounded-xl bg-[var(--glass-border)] animate-pulse" />
              <div className="flex items-start gap-3 px-1">
                <div className="w-10 h-10 rounded-full bg-[var(--glass-border)] animate-pulse shrink-0" />
                <div className="flex flex-col gap-2 flex-1 pt-1">
                  <div className="w-[80%] h-4 bg-[var(--glass-border)] rounded animate-pulse" />
                  <div className="w-[50%] h-3 bg-[var(--glass-border)] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : streams.length > 0 ? (
        <div className="video-grid">
          {streams.map((stream, index) => (
            <motion.div
              key={stream._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={`/stream/${stream._id}`} className="flex flex-col gap-3 group no-underline text-[var(--text-primary)]">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-color)]">
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <div className="stream-wave-animation small">
                      <span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 badge-live z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-[livePulse_2s_infinite]" />
                    LIVE
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 rounded flex items-center gap-1 backdrop-blur-sm shadow-sm border border-slate-200/50">
                    <HiOutlineEye className="text-sm" /> {stream.viewers || 0}
                  </div>
                </div>
                <div className="flex items-start gap-3 px-1">
                  <img
                    src={stream.streamer?.avatar?.url || stream.streamer?.avatar || '/default-avatar.png'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0 pr-4">
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug m-0 mb-1 group-hover:text-[var(--primary-soft)] transition-colors">{stream.title}</h3>
                    <p className="text-[13px] text-[var(--text-muted)] m-0 mb-1 truncate">
                      {stream.streamer?.fullName || stream.streamer?.username}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-teal-primary/10 text-[var(--primary)] border border-teal-primary/20 rounded-full" style={{ fontSize: 10, padding: '2px 6px' }}>
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
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] mb-4 opacity-50">📡</div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No live streams right now</h3>
          <p className="text-sm text-[var(--text-muted)]">Be the first to go live!</p>
          {user && (
            <Link to="/go-live" className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 outline-none border-none cursor-pointer text-sm font-medium no-underline mt-4">
              <HiOutlineVideoCamera className="text-[18px]" /> Start Streaming
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
