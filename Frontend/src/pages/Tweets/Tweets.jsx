import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt2, HiOutlineThumbUp, HiThumbUp,
  HiOutlineTrash, HiOutlineSparkles, HiOutlineShare
} from 'react-icons/hi';
import { timeAgo } from '../../utils/formatters';

export default function Tweets() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTweets();
  }, [user]);

  const fetchTweets = async () => {
    try {
      const { data } = await API.get(`/tweets/user/${user._id}`);
      setTweets(data.data || []);
    } catch (e) {
      console.error('Failed to fetch tweets:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTweet.trim() || posting) return;
    setPosting(true);
    try {
      await API.post('/tweets', { content: newTweet });
      setNewTweet('');
      fetchTweets();
      toast.success('Post shared with the community! 🎉');
    } catch (err) {
      toast.error('Failed to share post');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await API.delete(`/tweets/${tweetId}`);
      setTweets(prev => prev.filter(t => t._id !== tweetId));
      toast.success('Post deleted');
    } catch (e) {
      toast.error('Failed to delete post');
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const { data } = await API.post(`/likes/toggle/t/${tweetId}`);
      setTweets(prev => prev.map(t =>
        t._id === tweetId
          ? { ...t, isLiked: data.data.isLiked, likesCount: data.data.isLiked ? (t.likesCount || 0) + 1 : Math.max((t.likesCount || 1) - 1, 0) }
          : t
      ));
    } catch (e) {
      toast.error('Please sign in to like');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div>
          <motion.h1
            className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900 m-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-sky-500/20">
              <HiOutlineChatAlt2 />
            </div>
            <span>Community <span className="bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 text-transparent bg-clip-text">Feed</span></span>
          </motion.h1>
          <p className="text-slate-500 text-sm mt-1.5 ml-0 sm:ml-13">
            Share updates, thoughts, and connect with your audience.
          </p>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto w-full flex flex-col gap-6">
        {/* Create Tweet Box */}
        <motion.div
          className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form className="flex flex-col gap-4" onSubmit={handlePost}>
            <div className="flex gap-3.5 items-start">
              <img
                src={user?.avatar}
                alt=""
                className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-500/20 shadow-sm shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all resize-none min-h-[90px]"
                  placeholder="What's on your mind? Share an update or thought..."
                  value={newTweet}
                  onChange={e => setNewTweet(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 pl-14">
              <span className="text-xs text-slate-400 font-medium">
                {newTweet.length}/500
              </span>
              <motion.button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-400 hover:via-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newTweet.trim() || posting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HiOutlineSparkles className="text-base" />
                <span>{posting ? 'Posting…' : 'Post Update'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Tweets List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-4 w-32 bg-slate-200 rounded" />
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : tweets.length > 0 ? (
            <AnimatePresence>
              {tweets.map((tweet, i) => (
                <motion.div
                  key={tweet._id}
                  className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative group"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={tweet.ownerDetails?.avatar?.url || tweet.ownerDetails?.avatar || user?.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/20 shadow-sm shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-slate-900 leading-tight">
                          {tweet.ownerDetails?.fullName || tweet.ownerDetails?.username || user?.fullName || user?.username}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-sky-600 font-medium">@{tweet.ownerDetails?.username || user?.username}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-xs text-slate-400 font-medium">{timeAgo(tweet.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {tweet.ownerDetails?.username === user?.username && (
                      <button
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer border-none bg-transparent"
                        onClick={() => handleDelete(tweet._id)}
                        title="Delete post"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    )}
                  </div>

                  <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap m-0 my-1 pl-13">
                    {tweet.content}
                  </p>

                  <div className="flex items-center gap-6 pt-3 border-t border-slate-100 pl-13 mt-1">
                    <motion.button
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                        tweet.isLiked
                          ? 'bg-sky-50 border-sky-300 text-sky-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-sky-600'
                      }`}
                      onClick={() => handleLike(tweet._id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      {tweet.isLiked ? <HiThumbUp className="text-sm text-sky-600" /> : <HiOutlineThumbUp className="text-sm" />}
                      <span>{tweet.likesCount || 0}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-5 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="text-[48px] mb-3 opacity-60">💬</div>
              <h3 className="text-xl font-bold mb-1.5 text-slate-900">No community posts yet</h3>
              <p className="text-sm text-slate-500 max-w-[400px]">
                Be the first to share an update with your subscribers!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
