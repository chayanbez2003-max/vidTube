import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { HiOutlineUserGroup, HiOutlinePlay } from 'react-icons/hi';


export default function Subscriptions() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await API.get(`/subscriptions/u/${user._id}`);
      // Filter out self-subscription just in case (backend handles this too)
      const filtered = (data.data || []).filter(item => 
        String(item.subscribedChannel?._id) !== String(user._id)
      );
      setChannels(filtered);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-white/90 mb-6"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineUserGroup className="text-teal-primary" /> Your <span className="text-teal-gradient">Subscriptions</span>
      </motion.h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full h-[200px] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : channels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {channels.map((item, i) => {
            const ch = item.subscribedChannel;
            return (
              <motion.div key={ch._id} className="flex flex-col items-center text-center p-6 bg-bg-surface border border-white/10 rounded-2xl"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                <Link to={`/channel/${ch.username}`} className="flex flex-col items-center text-center no-underline">
                  <img src={ch.avatar?.url || ch.avatar} alt="" className="w-20 h-20 rounded-full object-cover mb-4" />
                  <h3 className="text-base font-light text-white/90 m-0">{ch.fullName}</h3>
                  <p className="text-[13px] text-white/50 m-0 mt-1">@{ch.username}</p>
                </Link>
                {ch.latestVideo && (
                  <Link to={`/video/${ch.latestVideo._id}`} className="mt-5 pt-5 border-t border-white/5 no-underline flex flex-col gap-2 w-full group">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5">
                      <img src={ch.latestVideo.thumbnail?.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><HiOutlinePlay className="text-white text-3xl" /></div>
                    </div>
                    <p className="text-xs font-medium text-white/70 truncate m-0 group-hover:text-teal-soft transition-colors">{ch.latestVideo.title}</p>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] mb-4 opacity-50">📺</div>
          <h3 className="text-xl font-semibold mb-2 text-white/90">No subscriptions</h3>
          <p className="text-sm text-white/50">Subscribe to channels to see them here</p>
        </div>
      )}
    </div>
  );
}
