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

  const handleDeleteVideo = async (videoId) => {
    try {
      await API.delete(`/video/${videoId}`);
      setVideos(prev => prev.filter(v => v._id !== videoId));
      toast.success('Video deleted successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete video');
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
      <div className="max-w-[1280px] mx-auto">
        <div className="w-full h-48 md:h-64 rounded-b-xl skeleton" />
        <div className="flex gap-6 mt-6 px-4 md:px-6">
          <div className="w-24 h-24 rounded-full skeleton shrink-0" />
          <div className="flex-1 mt-4 max-w-sm h-8 rounded-md skeleton" />
        </div>
      </div>
    );
  }

  if (!channel) return <div className="max-w-[1280px] mx-auto p-4"><div className="flex justify-center py-20 text-white/50 text-xl font-medium">Channel not found</div></div>;

  return (
    <div className="w-full">
      <motion.div
        className="w-full h-48 md:h-64 lg:h-80 bg-bg-surface object-cover relative bg-cover bg-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ backgroundImage: channel.coverImage ? `url(${channel.coverImage})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
      </motion.div>

      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
        <motion.div
          className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 -mt-12 md:-mt-16 relative z-10 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <img src={channel.avatar} alt={channel.username} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-bg-base object-cover bg-bg-surface shrink-0 ring-2 ring-transparent" />
          <div className="flex flex-col items-center md:items-start flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-light text-white/90 m-0 text-center md:text-left">{channel.fullName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-[14px] text-white/60">
              <span className="font-medium text-white/80">@{channel.username}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><HiOutlineUsers className="text-[16px]" /> {formatCount(channel.subscribersCount)} subscribers</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{videos.length} videos</span>
            </div>
          </div>
          {user && user.username !== channel.username && (
            <motion.button
              className={`${channel.isSubscribed ? 'btn-ghost' : 'btn-primary'} !py-2 !px-5 flex items-center justify-center gap-2`}
              onClick={handleSubscribe}
              whileTap={{ scale: 0.95 }}
            >
              {channel.isSubscribed ? <><HiUserAdd className="text-lg" /> Subscribed</> : <><HiOutlineUserAdd className="text-lg" /> Subscribe</>}
            </motion.button>
          )}
        </motion.div>

        <div className="flex items-center gap-6 border-b border-white/10 mb-6 px-2">
          {['videos', 'playlists'].map(tab => (
            <button
              key={tab}
              className={`pb-3 font-medium text-sm transition-colors relative cursor-pointer outline-none bg-transparent border-none p-0 ${activeTab === tab ? 'text-teal-soft before:absolute before:bottom-[-1px] before:left-0 before:right-0 before:h-[2px] before:bg-teal-primary before:shadow-[0_0_8px_rgba(29,184,168,0.5)]' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'videos' && (
          videos.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-start">
              {videos.map((v, i) => (
                <VideoCard
                  key={v._id}
                  video={v}
                  index={i}
                  isOwner={user && user.username === channel.username}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-[60px] px-5 text-center">
              <div className="text-[48px] text-white/20 mb-4"><HiOutlineVideoCamera /></div>
              <h3 className="text-xl font-semibold mb-2 text-white/90">No videos yet</h3>
              <p className="text-sm text-white/50 max-w-[400px]">This channel hasn't uploaded any videos.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
