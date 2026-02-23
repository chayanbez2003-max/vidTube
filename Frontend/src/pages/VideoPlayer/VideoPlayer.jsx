import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineThumbUp, HiThumbUp, HiOutlineShare,
  HiOutlineDotsHorizontal, HiOutlineUserAdd, HiUserAdd,
  HiOutlineEye
} from 'react-icons/hi';
import './VideoPlayer.css';

function formatViews(v) {
  if (!v) return '0';
  if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v/1000).toFixed(1) + 'K';
  return v;
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 3600) return Math.floor(diff/60) + ' min ago';
  if (diff < 86400) return Math.floor(diff/3600) + ' hours ago';
  if (diff < 2592000) return Math.floor(diff/86400) + ' days ago';
  return Math.floor(diff/2592000) + ' months ago';
}

export default function VideoPlayer() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    fetchVideo();
    fetchComments();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/video/${videoId}`);
      const v = data.data;
      setVideo(v);
      setIsLiked(v.isLiked || false);
      setLikesCount(v.likesCount || 0);
      setIsSubscribed(v.owner?.isSubscribed || false);
      setSubscribersCount(v.owner?.subscribersCount || 0);
    } catch (err) {
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await API.get(`/comment/${videoId}`);
      setComments(data.data?.docs || data.data || []);
    } catch (err) { /* ignore */ }
  };

  const handleLike = async () => {
    if (!user) return toast.error('Please sign in to like');
    try {
      const { data } = await API.post(`/likes/toggle/v/${videoId}`);
      setIsLiked(data.data.isLiked);
      setLikesCount(prev => data.data.isLiked ? prev + 1 : prev - 1);
    } catch (err) {
      toast.error('Failed to toggle like');
    }
  };

  const handleSubscribe = async () => {
    if (!user || !video?.owner?._id) return toast.error('Please sign in');
    try {
      const { data } = await API.post(`/subscriptions/c/${video.owner._id}`);
      setIsSubscribed(data.data.isSubscribed);
      setSubscribersCount(prev => data.data.isSubscribed ? prev + 1 : prev - 1);
      toast.success(data.data.isSubscribed ? 'Subscribed!' : 'Unsubscribed');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await API.post(`/comment/${videoId}`, { content: newComment });
      setNewComment('');
      fetchComments();
      toast.success('Comment added!');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) {
    return (
      <div className="page-container video-player-page">
        <div className="vp-main">
          <div className="skeleton skeleton-player" />
        </div>
      </div>
    );
  }

  if (!video) return <div className="page-container"><div className="empty-state"><h3>Video not found</h3></div></div>;

  return (
    <div className="page-container video-player-page">
      <div className="vp-main">
        <motion.div
          className="vp-player-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <video
            controls
            autoPlay
            className="vp-player"
            src={video.videoFile?.url}
            poster={video.thumbnail?.url}
          />
        </motion.div>

        <div className="vp-details">
          <h1 className="vp-title">{video.title}</h1>

          <div className="vp-actions-row">
            <div className="vp-channel-info">
              <Link to={`/channel/${video.owner?.username}`} className="vp-channel-link">
                <img src={video.owner?.avatar?.url || video.owner?.avatar} alt="" className="avatar avatar-md" />
                <div>
                  <p className="vp-channel-name">{video.owner?.username}</p>
                  <p className="vp-subscribers">{formatViews(subscribersCount)} subscribers</p>
                </div>
              </Link>
              {user && String(user._id) !== String(video.owner?._id) && (
                <motion.button
                  className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'} subscribe-btn`}
                  onClick={handleSubscribe}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubscribed ? <><HiUserAdd /> Subscribed</> : <><HiOutlineUserAdd /> Subscribe</>}
                </motion.button>
              )}
            </div>

            <div className="vp-action-buttons">
              <motion.button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} whileTap={{ scale: 0.9 }}>
                {isLiked ? <HiThumbUp /> : <HiOutlineThumbUp />}
                <span>{formatViews(likesCount)}</span>
              </motion.button>
              <motion.button className="action-btn" onClick={handleShare} whileTap={{ scale: 0.9 }}>
                <HiOutlineShare /> Share
              </motion.button>
            </div>
          </div>

          <motion.div className="vp-description glass-card" onClick={() => setShowDesc(!showDesc)}>
            <div className="vp-desc-stats">
              <span><HiOutlineEye /> {formatViews(video.views)} views</span>
              <span>• {timeAgo(video.createdAt)}</span>
            </div>
            <p className={`vp-desc-text ${showDesc ? 'expanded' : ''}`}>
              {video.description}
            </p>
            <button className="show-more-btn">{showDesc ? 'Show less' : '...more'}</button>
          </motion.div>
        </div>

        <div className="vp-comments-section">
          <h2 className="vp-comments-title">{comments.length} Comments</h2>

          {user && (
            <form className="comment-form" onSubmit={handleComment}>
              <img src={user.avatar} alt="" className="avatar avatar-sm" />
              <input
                type="text"
                className="input-field"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <motion.button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim()}
                whileTap={{ scale: 0.95 }}
              >
                Comment
              </motion.button>
            </form>
          )}

          <div className="comments-list">
            <AnimatePresence>
              {comments.map((comment, i) => (
                <motion.div
                  key={comment._id}
                  className="comment-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <img
                    src={comment.owner?.avatar?.url || comment.owner?.avatar || ''}
                    alt=""
                    className="avatar avatar-sm"
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{comment.owner?.username || 'User'}</span>
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-actions">
                      {/*   */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
