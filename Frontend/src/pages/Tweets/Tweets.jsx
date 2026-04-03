import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt2, HiOutlineThumbUp, HiThumbUp,
  HiOutlineTrash, HiOutlinePencil
} from 'react-icons/hi';
import { timeAgo } from '../../utils/formatters';




export default function Tweets() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTweets();
  }, [user]);

  const fetchTweets = async () => {
    try {
      const { data } = await API.get(`/tweets/user/${user._id}`);
      setTweets(data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;
    try {
      await API.post('/tweets', { content: newTweet });
      setNewTweet('');
      fetchTweets();
      toast.success('Tweet posted!');
    } catch (err) {
      toast.error('Failed to post');
    }
  };

  const handleDelete = async (tweetId) => {
    try {
      await API.delete(`/tweets/${tweetId}`);
      setTweets(prev => prev.filter(t => t._id !== tweetId));
      toast.success('Deleted');
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const { data } = await API.post(`/likes/toggle/t/${tweetId}`);
      setTweets(prev => prev.map(t =>
        t._id === tweetId
          ? { ...t, isLiked: data.data.isLiked, likesCount: data.data.isLiked ? t.likesCount + 1 : t.likesCount - 1 }
          : t
      ));
    } catch (e) {}
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-white/90 mb-6"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineChatAlt2 className="text-teal-primary" /> Community <span className="text-teal-gradient">Tweets</span>
      </motion.h1>

      <div className="max-w-[700px] mx-auto w-full flex flex-col gap-6">
        <form className="w-full bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6 flex gap-4 md:gap-5" onSubmit={handlePost}>
          <img src={user?.avatar} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0" />
          <div className="flex flex-col flex-1 gap-3">
            <textarea
              className="w-full bg-transparent border-b border-white/10 text-[15px] text-white/90 focus:outline-none focus:border-teal-primary transition-colors resize-none placeholder:text-white/30 pb-2 min-h-[60px]"
              placeholder="What's on your mind?"
              value={newTweet}
              onChange={e => setNewTweet(e.target.value)}
              rows={2}
            />
            <motion.button type="submit" className="btn-primary self-end rounded-full !px-6 !py-2 !text-sm flex items-center justify-center font-medium shadow-none cursor-pointer border-none outline-none"
              disabled={!newTweet.trim()} whileTap={{ scale: 0.95 }}>
              Post
            </motion.button>
          </div>
        </form>

        <div className="flex flex-col gap-5">
          <AnimatePresence>
            {tweets.map((tweet, i) => (
              <motion.div key={tweet._id} className="w-full bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-3 group relative"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-center gap-3 mb-1">
                  <img src={tweet.ownerDetails?.avatar?.url || tweet.ownerDetails?.avatar || user?.avatar}
                    alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[15px] text-white/90 leading-tight">{tweet.ownerDetails?.username || user?.username}</span>
                    <span className="text-xs text-white/40 leading-tight">{timeAgo(tweet.createdAt)}</span>
                  </div>
                </div>
                <p className="text-[15px] text-white/80 leading-relaxed whitespace-pre-wrap m-0 mb-2">{tweet.content}</p>
                <div className="flex items-center gap-4">
                  <motion.button className={`flex items-center gap-1.5 text-[14px] font-medium hover:text-white/80 bg-transparent border-none p-0 cursor-pointer transition-colors outline-none ${tweet.isLiked ? 'text-teal-primary' : 'text-white/40'}`}
                    onClick={() => handleLike(tweet._id)} whileTap={{ scale: 0.85 }}>
                    {tweet.isLiked ? <HiThumbUp className="text-[16px]" /> : <HiOutlineThumbUp className="text-[16px]" />}
                    <span>{tweet.likesCount || 0}</span>
                  </motion.button>
                  {tweet.ownerDetails?.username === user?.username && (
                    <button className="flex items-center gap-1.5 text-[14px] font-medium text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 absolute top-5 right-5 bg-transparent border-none p-0 cursor-pointer transition-all outline-none" onClick={() => handleDelete(tweet._id)}>
                      <HiOutlineTrash className="text-[16px]" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && tweets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
              <div className="text-[48px] mb-4 opacity-50">💬</div>
              <h3 className="text-xl font-semibold mb-2 text-white/90">No tweets yet</h3>
              <p className="text-sm text-white/50 max-w-[400px]">Share your thoughts with the community</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
