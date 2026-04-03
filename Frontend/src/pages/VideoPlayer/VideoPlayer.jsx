import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineThumbUp, HiThumbUp, HiOutlineShare,
  HiOutlineDotsHorizontal, HiOutlineUserAdd, HiUserAdd,
  HiOutlineEye, HiOutlinePencil, HiOutlineTrash
} from 'react-icons/hi';
import { formatViews, timeAgo } from '../../utils/formatters';




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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await API.delete(`/comment/c/${commentId}`);
      toast.success('Comment deleted');
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await API.patch(`/comment/c/${commentId}`, { content: editContent });
      setComments(prev => prev.map(c => 
        c._id === commentId ? { ...c, content: editContent } : c
      ));
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-[1024px] mx-auto">
          <div className="w-full aspect-video rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!video) return <div className="max-w-[1280px] mx-auto p-4"><div className="flex justify-center py-20 text-[var(--text-muted)] text-xl font-medium">Video not found</div></div>;

  // Fix Cloudinary URLs where video was uploaded as 'image' resource type
  // e.g. /image/upload/ → /video/upload/ so the browser can play it properly
  const getVideoUrl = (url) => {
    if (!url) return '';
    // If the Cloudinary URL has /image/upload/ instead of /video/upload/, fix it
    return url.replace('/image/upload/', '/video/upload/');
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <div className="w-full max-w-[1024px] mx-auto flex flex-col gap-6">
        <motion.div
          className="relative w-full aspect-video bg-bg-base rounded-2xl overflow-hidden shadow-glass-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <video
            controls
            autoPlay
            className="w-full h-full object-contain outline-none"
            src={getVideoUrl(video.videoFile?.url)}
            poster={video.thumbnail?.url}
          />
        </motion.div>

        <div className="flex flex-col gap-3">
          <h1 className="text-xl md:text-2xl font-light text-[var(--text-primary)] leading-tight">{video.title}</h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-1 border-b border-white/10 pb-4">
            <div className="flex items-center gap-5">
              <Link to={`/channel/${video.owner?.username}`} className="flex items-center gap-3 group outline-none">
                <img src={video.owner?.avatar?.url || video.owner?.avatar} alt="" className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-teal-primary/30 transition-all" />
                <div>
                  <p className="font-medium text-[15px] text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">{video.owner?.username}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatViews(subscribersCount)} subscribers</p>
                </div>
              </Link>
              {user && String(user._id) !== String(video.owner?._id) && (
                <motion.button
                  className={`${isSubscribed ? 'btn-ghost' : 'btn-primary'} !py-2 !px-4 !text-sm`}
                  onClick={handleSubscribe}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubscribed ? <><HiUserAdd className="text-lg" /> Subscribed</> : <><HiOutlineUserAdd className="text-lg" /> Subscribe</>}
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <motion.button className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isLiked ? 'bg-teal-primary/10 border-teal-primary/30 text-[var(--primary)]' : 'bg-[var(--glass-border)] border-white/10 text-[var(--text-primary)] hover:bg-white/10 md:hover:border-white/20'}`} onClick={handleLike} whileTap={{ scale: 0.9 }}>
                {isLiked ? <HiThumbUp className="text-[17px]" /> : <HiOutlineThumbUp className="text-[17px]" />}
                <span>{formatViews(likesCount)}</span>
              </motion.button>
              <motion.button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-border)] border border-white/10 text-[var(--text-primary)] text-sm font-medium hover:bg-white/10 md:hover:border-white/20 transition-colors" onClick={handleShare} whileTap={{ scale: 0.9 }}>
                <HiOutlineShare className="text-[17px]" /> Share
              </motion.button>
            </div>
          </div>

          <motion.div className="bg-[var(--glass-border)] border border-white/10 rounded-xl p-3.5 mt-2 cursor-pointer hover:bg-white/[0.07] transition-colors" onClick={() => setShowDesc(!showDesc)}>
            <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] mb-1.5">
              <span className="flex items-center gap-1.5"><HiOutlineEye className="text-base" /> {formatViews(video.views)} views</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{timeAgo(video.createdAt)}</span>
            </div>
            <p className={`text-[13.5px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap ${showDesc ? '' : 'line-clamp-2'}`}>
              {video.description}
            </p>
            <button className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1 cursor-pointer bg-transparent border-none p-0 outline-none">{showDesc ? 'Show less' : '...more'}</button>
          </motion.div>
        </div>

        <div className="mt-8">
          <h2 className="text-[18px] font-light text-[var(--text-primary)] mb-5">{comments.length} Comments</h2>

          {user && (
            <form className="flex items-start gap-3 mb-8" onSubmit={handleComment}>
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 flex flex-col items-end gap-2">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-white/20 text-[14px] text-[var(--text-primary)] pb-1.5 focus:border-teal-primary focus:outline-none transition-colors placeholder:text-[var(--text-muted)]"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <motion.button
                  type="submit"
                  className="btn-primary !py-1.5 !px-4 !text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newComment.trim()}
                  whileTap={{ scale: 0.95 }}
                >
                  Comment
                </motion.button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {comments.map((comment, i) => (
                <motion.div
                  key={comment._id}
                  className="flex gap-3 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <img
                    src={comment.owner?.avatar?.url || comment.owner?.avatar || ''}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">@{comment.owner?.username || 'User'}</span>
                      <span className="text-[12px] text-[var(--text-muted)]">{timeAgo(comment.createdAt)}</span>
                    </div>
                    
                    {editingCommentId === comment._id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          className="w-full bg-transparent border-b border-teal-primary text-[14px] text-[var(--text-primary)] pb-1.5 focus:outline-none resize-none overflow-hidden"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          autoFocus
                          rows={1}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" className="btn-ghost !py-1 !px-3 !text-[12px]" onClick={() => setEditingCommentId(null)}>Cancel</button>
                          <button type="button" className="btn-primary !py-1 !px-3 !text-[12px]" onClick={() => handleUpdateComment(comment._id)}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[14px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user && String(user._id) === String(comment.owner?._id || comment.owner) && (
                            <div className="flex items-center gap-3">
                              <button className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none p-0 cursor-pointer" onClick={() => startEditing(comment)}>
                                <HiOutlinePencil /> Edit
                              </button>
                              <button className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:text-red-400 bg-transparent border-none p-0 cursor-pointer" onClick={() => handleDeleteComment(comment._id)}>
                                <HiOutlineTrash /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
