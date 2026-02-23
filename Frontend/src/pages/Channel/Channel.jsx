import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import VideoCard from '../../components/VideoCard/VideoCard';
import toast from 'react-hot-toast';
import {
  HiOutlineUserAdd, HiUserAdd, HiOutlineEye, HiOutlineVideoCamera,
  HiOutlineUsers
} from 'react-icons/hi';
import './Channel.css';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n;
}

export default function Channel() {
  const { username } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannel();
  }, [username]);

  const fetchChannel = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/users/c/${username}`);
      setChannel(data.data);
      
      // Fetch channel videos
      const videosRes = await API.get('/video', { params: { userId: data.data._id } });
      setVideos(videosRes.data?.data?.docs || videosRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load channel');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return toast.error('Please sign in');
    try {
      const { data } = await API.post(`/subscriptions/c/${channel._id}`);
      setChannel(prev => ({
        ...prev,
        isSubscribed: data.data.isSubscribed,
        subscribersCount: data.data.isSubscribed ? prev.subscribersCount + 1 : prev.subscribersCount - 1
      }));
    } catch (err) {
      toast.error('Failed');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton channel-skeleton-banner" />
        <div className="channel-skeleton-info">
          <div className="skeleton channel-skeleton-avatar" />
          <div className="skeleton channel-skeleton-text" />
        </div>
      </div>
    );
  }

  if (!channel) return <div className="page-container"><div className="empty-state"><h3>Channel not found</h3></div></div>;

  return (
    <div className="channel-page">
      <motion.div
        className="channel-banner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ backgroundImage: channel.coverImage ? `url(${channel.coverImage})` : undefined }}
      >
        <div className="banner-overlay" />
      </motion.div>

      <div className="page-container">
        <motion.div
          className="channel-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <img src={channel.avatar} alt={channel.username} className="channel-avatar" />
          <div className="channel-info">
            <h1 className="channel-name">{channel.fullName}</h1>
            <div className="channel-stats">
              <span>@{channel.username}</span>
              <span>•</span>
              <span><HiOutlineUsers /> {formatCount(channel.subscribersCount)} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
          </div>
          {user && user.username !== channel.username && (
            <motion.button
              className={`btn ${channel.isSubscribed ? 'btn-secondary' : 'btn-primary'} subscribe-btn`}
              onClick={handleSubscribe}
              whileTap={{ scale: 0.95 }}
            >
              {channel.isSubscribed ? <><HiUserAdd /> Subscribed</> : <><HiOutlineUserAdd /> Subscribe</>}
            </motion.button>
          )}
        </motion.div>

        <div className="channel-tabs">
          {['videos', 'playlists'].map(tab => (
            <button
              key={tab}
              className={`channel-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="divider" style={{ margin: '0 0 24px' }} />

        {activeTab === 'videos' && (
          videos.length > 0 ? (
            <div className="video-grid">
              {videos.map((v, i) => <VideoCard key={v._id} video={v} index={i} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineVideoCamera /></div>
              <h3>No videos yet</h3>
              <p>This channel hasn't uploaded any videos.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
