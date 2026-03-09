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
import './Tweets.css';



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
    <div className="page-container">
      <motion.h1 className="page-title" style={{ marginBottom: 24 }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <HiOutlineChatAlt2 /> Community <span className="text-gradient">Tweets</span>
      </motion.h1>

      <div className="tweets-container">
        <form className="tweet-composer glass-card" onSubmit={handlePost}>
          <img src={user?.avatar} alt="" className="avatar avatar-md" />
          <div className="tweet-input-wrap">
            <textarea
              className="tweet-input"
              placeholder="What's on your mind?"
              value={newTweet}
              onChange={e => setNewTweet(e.target.value)}
              rows={2}
            />
            <motion.button type="submit" className="btn btn-primary tweet-post-btn"
              disabled={!newTweet.trim()} whileTap={{ scale: 0.95 }}>
              Post
            </motion.button>
          </div>
        </form>

        <div className="tweets-list">
          <AnimatePresence>
            {tweets.map((tweet, i) => (
              <motion.div key={tweet._id} className="tweet-card glass-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.03 }}>
                <div className="tweet-header">
                  <img src={tweet.ownerDetails?.avatar?.url || tweet.ownerDetails?.avatar || user?.avatar}
                    alt="" className="avatar avatar-sm" />
                  <div>
                    <span className="tweet-author">{tweet.ownerDetails?.username || user?.username}</span>
                    <span className="tweet-time">{timeAgo(tweet.createdAt)}</span>
                  </div>
                </div>
                <p className="tweet-content">{tweet.content}</p>
                <div className="tweet-actions">
                  <motion.button className={`tweet-action-btn ${tweet.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(tweet._id)} whileTap={{ scale: 0.85 }}>
                    {tweet.isLiked ? <HiThumbUp /> : <HiOutlineThumbUp />}
                    <span>{tweet.likesCount || 0}</span>
                  </motion.button>
                  {tweet.ownerDetails?.username === user?.username && (
                    <button className="tweet-action-btn delete" onClick={() => handleDelete(tweet._id)}>
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && tweets.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>No tweets yet</h3>
              <p>Share your thoughts with the community</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
