import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineEye, HiOutlineChatAlt2, HiOutlineUserGroup,
  HiOutlineArrowLeft, HiOutlineThumbUp, HiThumbUp,
  HiOutlinePencil, HiOutlineTrash
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { timeAgo, formatViews } from '../../utils/formatters';
import './LiveStream.css';



export default function WatchStream() {
  const { streamId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [streamEnded, setStreamEnded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [videoId, setVideoId] = useState(null);

  const chatEndRef = useRef(null);

  // Fetch stream data
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const { data } = await API.get(`/streams/${streamId}`);
        const s = data.data;
        setStream(s);
        setViewerCount(s.viewers || 0);
        setChatMessages(
          (s.chatMessages || []).map(m => ({
            username: m.username,
            avatar: m.avatar,
            message: m.message,
            timestamp: m.timestamp,
          }))
        );

        if (!s.isLive) {
          setStreamEnded(true);
        }

        // Use videoId from stream for likes/comments via existing video APIs
        if (s.videoId) {
          setVideoId(s.videoId);
          fetchVideoData(s.videoId);
        }
      } catch (error) {
        toast.error('Stream not found');
        navigate('/live');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [streamId]);

  // Fetch likes & comments using existing video APIs
  const fetchVideoData = async (vid) => {
    try {
      const promises = [
        API.get(`/comment/${vid}`).catch(() => null),
      ];
      
      // Only fetch video details (which includes isLiked) if user is logged in
      if (user) {
        promises.unshift(API.get(`/video/${vid}`).catch(() => null));
      } else {
        promises.unshift(Promise.resolve(null));
      }

      const [videoRes, commentsRes] = await Promise.all(promises);
      
      if (videoRes?.data?.data) {
        setIsLiked(videoRes.data.data.isLiked || false);
        setLikesCount(videoRes.data.data.likesCount || 0);
      }
      
      if (commentsRes?.data?.data) {
        setComments(commentsRes.data.data?.docs || commentsRes.data.data || []);
      }
    } catch (err) { /* ignore */ }
  };

  // Socket events
  useEffect(() => {
    if (!socket || !streamId) return;

    // Join the stream room
    socket.emit('stream:join', streamId);

    socket.on('stream:viewers', (count) => setViewerCount(count));
    socket.on('stream:chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    socket.on('stream:ended', () => {
      setStreamEnded(true);
      toast('Stream has ended', { icon: '🔴' });
    });

    return () => {
      socket.emit('stream:leave', streamId);
      socket.off('stream:viewers');
      socket.off('stream:chat:message');
      socket.off('stream:ended');
    };
  }, [socket, streamId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;

    socket.emit('stream:chat', {
      streamId,
      message: chatInput.trim(),
      username: user.username,
      avatar: user.avatar?.url || user.avatar || '',
      userId: user._id,
    });

    setChatInput('');
  };

  const handleToggleLike = async () => {
    if (!user) return toast.error('Please sign in to like');
    if (!videoId) return toast.error('Stream not ready');
    try {
      const { data } = await API.post(`/likes/toggle/v/${videoId}`);
      setIsLiked(data.data.isLiked);
      setLikesCount(prev => data.data.isLiked ? prev + 1 : Math.max(0, prev - 1));
      toast.success(data.data.isLiked ? 'Liked!' : 'Unliked');
    } catch (err) {
      toast.error('Failed to toggle like');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !videoId) return;
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

  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="dash-loading">
          <div className="dash-loading-spinner" />
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <h3>Stream not found</h3>
          <Link to="/live" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse Live Streams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="live-layout">
        {/* Stream Area */}
        <div className="live-video-area">
          <div className="live-video-container watch-stream-container">
            {streamEnded ? (
              <div className="stream-ended-overlay">
                <div className="stream-ended-content">
                  <div className="stream-ended-icon">📡</div>
                  <h2>Stream has ended</h2>
                  <p>This stream is no longer live</p>
                  <Link to="/live" className="btn btn-primary" style={{ marginTop: 16 }}>
                    Browse Live Streams
                  </Link>
                </div>
              </div>
            ) : (
              <div className="stream-live-placeholder">
                <div className="stream-wave-animation">
                  <span /><span /><span /><span /><span />
                </div>
                <p>🔴 LIVE — Stream is active</p>
                <p className="stream-placeholder-sub">
                  Peer-to-peer video coming from <strong>{stream.streamer?.username}</strong>
                </p>
              </div>
            )}

            {!streamEnded && (
              <div className="live-overlay-top">
                <div className="live-badge-container">
                  <span className="live-badge-dot" />
                  <span className="live-badge-text">LIVE</span>
                </div>
                <div className="live-stats">
                  <span className="live-stat">
                    <HiOutlineEye /> {formatViews(viewerCount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="watch-stream-info">
            <div className="watch-stream-header">
              <div className="watch-stream-streamer">
                <img
                  src={stream.streamer?.avatar?.url || stream.streamer?.avatar || '/default-avatar.png'}
                  alt=""
                  className="avatar avatar-lg"
                />
                <div>
                  <h2 className="watch-stream-title">{stream.title}</h2>
                  <p className="watch-stream-meta">
                    <Link to={`/channel/${stream.streamer?.username}`} className="watch-stream-username">
                      {stream.streamer?.fullName || stream.streamer?.username}
                    </Link>
                    <span> Started {timeAgo(stream.startedAt)}</span>
                  </p>
                </div>
              </div>

              <div className="watch-stream-actions">
                <motion.button 
                  className={`live-action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                  whileTap={{ scale: 0.9 }}
                >
                  {isLiked ? <HiThumbUp /> : <HiOutlineThumbUp />}
                  <span>{likesCount > 0 ? likesCount : 'Like'}</span>
                </motion.button>
              </div>
            </div>

            {stream.description && (
              <p className="watch-stream-desc">{stream.description}</p>
            )}
            <div className="watch-stream-tags">
              <span className="badge badge-accent">{stream.category}</span>
              {stream.tags?.map(tag => (
                <span key={tag} className="live-tag">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="live-comments-section glass-card">
            <h3>Comments</h3>
            {user && (
              <form className="live-comment-form" onSubmit={handleAddComment}>
                <img src={user.avatar} alt="" className="avatar avatar-sm" />
                <input 
                  type="text" 
                  placeholder="Add a public comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()}>Post</button>
              </form>
            )}
            
            <div className="live-comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="live-comment-item">
                    <img src={c.owner?.avatar} alt="" className="avatar avatar-sm" />
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
                          {user && String(user._id) === String(c.owner?._id || c.owner) && (
                            <div className="comment-actions">
                              <button onClick={() => startEditing(c)} title="Edit">
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

        {/* Chat */}
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
                <p>No messages yet</p>
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

          {user && !streamEnded ? (
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
          ) : !user ? (
            <div className="live-chat-login">
              <Link to="/login">Sign in</Link> to chat
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
