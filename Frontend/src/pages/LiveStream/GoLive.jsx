import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineStatusOnline, HiOutlineVideoCamera, HiOutlineEye,
  HiOutlineChatAlt2, HiOutlineTag, HiOutlineStop, HiOutlineUserGroup,
  HiOutlineThumbUp, HiThumbUp, HiOutlinePencil, HiOutlineTrash
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/formatters';
import './LiveStream.css';

const CATEGORIES = [
  'education', 'entertainment', 'gaming', 'music',
  'news', 'sports', 'technology', 'other'
];

export default function GoLive() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [step, setStep] = useState('setup'); // 'setup' | 'live'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [stream, setStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [videoId, setVideoId] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  // Listen for viewer count and chat
  useEffect(() => {
    if (!socket || !stream) return;

    socket.on('stream:viewers', (count) => setViewerCount(count));
    socket.on('stream:chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('stream:viewers');
      socket.off('stream:chat:message');
    };
  }, [socket, stream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Timer for stream duration
  useEffect(() => {
    if (step === 'live') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      mediaStreamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Failed to access camera/mic. Please grant permissions.');
      console.error('Media error:', error);
    }
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    setLoading(true);

    try {
      // Start camera first
      await startCamera();

      // Create stream in backend
      const { data } = await API.post('/streams/start', {
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
      });

      const newStream = data.data;
      setStream(newStream);
      setStep('live');

      // Store videoId for likes/comments
      if (newStream.videoId) {
        setVideoId(newStream.videoId);
        fetchVideoData(newStream.videoId);
      }

      // Join the stream room
      if (socket) {
        socket.emit('stream:join', newStream._id);
      }

      toast.success('🔴 You are now LIVE!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!stream) return;

    try {
      await API.post(`/streams/end/${stream._id}`);

      // Notify viewers
      if (socket) {
        socket.emit('stream:end', stream._id);
        socket.emit('stream:leave', stream._id);
      }

      // Stop camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      clearInterval(timerRef.current);
      toast.success('Stream ended successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to end stream');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !stream) return;

    socket.emit('stream:chat', {
      streamId: stream._id,
      message: chatInput.trim(),
      username: user.username,
      avatar: user.avatar?.url || user.avatar || '',
      userId: user._id,
    });

    setChatInput('');
  };

  // Fetch likes & comments using existing video APIs
  const fetchVideoData = async (vid) => {
    try {
      const [videoRes, commentsRes] = await Promise.all([
        API.get(`/video/${vid}`).catch(() => null),
        API.get(`/comment/${vid}`).catch(() => null),
      ]);
      if (videoRes?.data?.data) {
        setIsLiked(videoRes.data.data.isLiked || false);
        setLikesCount(videoRes.data.data.likesCount || 0);
      }
      if (commentsRes?.data?.data) {
        setComments(commentsRes.data.data?.docs || commentsRes.data.data || []);
      }
    } catch (err) { /* ignore */ }
  };

  const handleToggleLike = async () => {
    if (!videoId) return;
    try {
      const { data } = await API.post(`/likes/toggle/v/${videoId}`);
      setIsLiked(data.data.isLiked);
      setLikesCount(prev => data.data.isLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to toggle like');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !videoId) return;
    try {
      const { data } = await API.post(`/comment/${videoId}`, { content: newComment });
      setComments(prev => [data.data, ...prev]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await API.delete(`/comment/c/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const { data } = await API.patch(`/comment/c/${commentId}`, { content: editContent });
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, content: data.data.content } : c));
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  // ==================== SETUP SCREEN ====================
  if (step === 'setup') {
    return (
      <div className="page-container">
        <motion.div
          className="golive-setup"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="golive-header">
            <HiOutlineStatusOnline className="golive-header-icon" />
            <h1>Go <span className="text-gradient">Live</span></h1>
            <p>Set up your stream and start broadcasting to your audience</p>
          </div>

          <div className="golive-form">
            <div className="input-group">
              <label>Stream Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="What are you streaming today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                className="input-field"
                placeholder="Tell viewers what your stream is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="golive-form-row">
              <div className="input-group">
                <label>Category</label>
                <select
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="gaming, minecraft, live"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <motion.button
              className="btn btn-primary golive-btn"
              onClick={handleGoLive}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <span className="golive-spinner" />
                  Starting Stream...
                </>
              ) : (
                <>
                  <HiOutlineVideoCamera />
                  Go Live Now
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== LIVE SCREEN ====================
  return (
    <div className="page-container">
      <div className="live-layout">
        {/* Video Area */}
        <div className="live-video-area">
          <div className="live-video-container">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="live-video"
            />

            {/* Live overlay */}
            <div className="live-overlay-top">
              <div className="live-badge-container">
                <span className="live-badge-dot" />
                <span className="live-badge-text">LIVE</span>
              </div>
              <div className="live-stats">
                <span className="live-stat">
                  <HiOutlineEye /> {viewerCount}
                </span>
                <span className="live-stat">
                  ⏱ {formatTime(elapsedTime)}
                </span>
              </div>
            </div>

            <div className="live-overlay-bottom">
              <h2 className="live-title">{stream?.title}</h2>
              <div className="live-meta">
                <span className="badge badge-accent">{category}</span>
                {stream?.tags?.map(tag => (
                  <span key={tag} className="live-tag">#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="live-controls">
            <motion.button
              className={`live-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleToggleLike}
              whileTap={{ scale: 0.9 }}
            >
              {isLiked ? <HiThumbUp /> : <HiOutlineThumbUp />}
              <span>{likesCount > 0 ? likesCount : 'Like'}</span>
            </motion.button>

            <motion.button
              className="btn btn-danger golive-end-btn"
              onClick={handleEndStream}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineStop /> End Stream
            </motion.button>
          </div>

          {/* Comments Section */}
          <div className="live-comments-section glass-card">
            <h3>Comments ({comments.length})</h3>
            <form className="live-comment-form" onSubmit={handleAddComment}>
              <img src={user?.avatar?.url || user?.avatar} alt="" className="avatar avatar-sm" />
              <input
                type="text"
                placeholder="Add a public comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" disabled={!newComment.trim()}>Post</button>
            </form>

            <div className="live-comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="live-comment-item">
                    <img src={c.owner?.avatar?.url || c.owner?.avatar} alt="" className="avatar avatar-sm" />
                    <div className="live-comment-content">
                      <div className="live-comment-meta">
                        <strong>{c.owner?.username}</strong>
                        <span>{timeAgo(c.createdAt)}</span>
                      </div>

                      {editingCommentId === c._id ? (
                        <div className="live-comment-edit">
                          <input
                            className="edit-input"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                            <button onClick={() => handleUpdateComment(c._id)}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>{c.content}</p>
                          {String(user?._id) === String(c.owner?._id || c.owner) && (
                            <div className="comment-actions">
                              <button onClick={() => { setEditingCommentId(c._id); setEditContent(c.content); }} title="Edit">
                                <HiOutlinePencil />
                              </button>
                              <button className="delete" onClick={() => handleDeleteComment(c._id)} title="Delete">
                                <HiOutlineTrash />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="live-chat">
          <div className="live-chat-header">
            <HiOutlineChatAlt2 />
            <h3>Live Chat</h3>
            <span className="live-chat-count">
              <HiOutlineUserGroup /> {viewerCount}
            </span>
          </div>

          <div className="live-chat-messages">
            {chatMessages.length === 0 ? (
              <div className="live-chat-empty">
                <HiOutlineChatAlt2 />
                <p>Chat messages will appear here</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  className="live-chat-msg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <img
                    src={msg.avatar || '/default-avatar.png'}
                    alt=""
                    className="live-chat-avatar"
                  />
                  <div>
                    <span className="live-chat-username">{msg.username}</span>
                    <span className="live-chat-text">{msg.message}</span>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="live-chat-input" onSubmit={handleSendChat}>
            <input
              type="text"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={300}
            />
            <button type="submit" disabled={!chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
