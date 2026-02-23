import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { HiOutlineUserGroup, HiOutlinePlay } from 'react-icons/hi';
import './Subscriptions.css';

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
      setChannels(data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="page-container">
      <motion.h1 className="page-title" style={{ marginBottom: 24 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineUserGroup /> Your <span className="text-gradient">Subscriptions</span>
      </motion.h1>

      {loading ? (
        <div className="subs-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton sub-skeleton" />
          ))}
        </div>
      ) : channels.length > 0 ? (
        <div className="subs-grid">
          {channels.map((item, i) => {
            const ch = item.subscribedChannel;
            return (
              <motion.div key={ch._id} className="sub-card glass-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                <Link to={`/channel/${ch.username}`} className="sub-link">
                  <img src={ch.avatar?.url || ch.avatar} alt="" className="avatar avatar-xl" />
                  <h3 className="sub-name">{ch.fullName}</h3>
                  <p className="sub-username">@{ch.username}</p>
                </Link>
                {ch.latestVideo && (
                  <Link to={`/video/${ch.latestVideo._id}`} className="sub-latest">
                    <div className="sub-latest-thumb">
                      <img src={ch.latestVideo.thumbnail?.url} alt="" />
                      <div className="sub-latest-play"><HiOutlinePlay /></div>
                    </div>
                    <p className="sub-latest-title">{ch.latestVideo.title}</p>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📺</div>
          <h3>No subscriptions</h3>
          <p>Subscribe to channels to see them here</p>
        </div>
      )}
    </div>
  );
}
