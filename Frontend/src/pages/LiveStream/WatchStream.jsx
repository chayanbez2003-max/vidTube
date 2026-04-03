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
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-white/50">
          <div className="w-10 h-10 border-2 border-teal-primary/30 border-t-teal-primary rounded-full animate-spin" />
          <p className="text-sm">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <div className="text-[48px] opacity-50">📡</div>
        <h3 className="text-xl font-semibold text-white/90 m-0">Stream not found</h3>
        <Link to="/live" className="btn-primary px-5 py-2.5 no-underline border-none cursor-pointer outline-none text-sm font-medium flex items-center gap-2 mt-2">
          Browse Live Streams
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Stream Area */}
        <div className="flex-[2] flex flex-col gap-6 min-w-0">
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] group">
            {streamEnded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-bg-elevated">
                <div className="text-[56px] opacity-60">📡</div>
                <h2 className="text-2xl font-bold text-white/90 m-0">Stream has ended</h2>
                <p className="text-white/50 text-sm m-0">This stream is no longer live</p>
                <Link to="/live" className="btn-primary px-5 py-2.5 no-underline border-none cursor-pointer outline-none text-sm font-medium flex items-center gap-2 mt-2">
                  Browse Live Streams
                </Link>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-bg-elevated">
                <div className="stream-wave-animation">
                  <span /><span /><span /><span /><span />
                </div>
                <p className="text-white/80 font-semibold text-base m-0">🔴 LIVE — Stream is active</p>
                <p className="text-white/40 text-sm m-0">
                  Peer-to-peer video coming from <strong className="text-white/70">{stream.streamer?.username}</strong>
                </p>
              </div>
            )}

            {!streamEnded && (
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="badge-live">
                  <span className="w-2 h-2 rounded-full bg-live animate-[livePulse_2s_infinite]" />
                  <span>LIVE</span>
                </div>
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md text-white/90 text-sm font-medium flex items-center gap-1.5 border border-white/10">
                  <HiOutlineEye /> {formatViews(viewerCount)}
                </span>
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="flex flex-col gap-4 p-5 bg-bg-surface border border-white/10 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src={stream.streamer?.avatar?.url || stream.streamer?.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <h2 className="text-xl font-bold text-white/90 m-0 mb-1 leading-snug">{stream.title}</h2>
                  <p className="text-sm text-white/50 m-0 flex items-center gap-2 flex-wrap">
                    <Link to={`/channel/${stream.streamer?.username}`} className="font-semibold text-teal-soft no-underline hover:text-teal-primary transition-colors">
                      {stream.streamer?.fullName || stream.streamer?.username}
                    </Link>
                    <span>· Started {timeAgo(stream.startedAt)}</span>
                  </p>
                </div>
              </div>

              <motion.button 
                className={`flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-xl border transition-all font-medium text-sm cursor-pointer outline-none ${isLiked ? '!text-teal-primary !bg-teal-primary/10 !border-teal-primary/20' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                onClick={handleToggleLike}
                whileTap={{ scale: 0.9 }}
              >
                {isLiked ? <HiThumbUp className="text-[18px]" /> : <HiOutlineThumbUp className="text-[18px]" />}
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </motion.button>
            </div>

            {stream.description && (
              <p className="text-[14.5px] text-white/60 leading-relaxed m-0 pt-4 border-t border-white/5">{stream.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-teal-primary/10 text-teal-primary border border-teal-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{stream.category}</span>
              {stream.tags?.map(tag => (
                <span key={tag} className="text-xs text-white/60 font-medium bg-white/5 px-2 py-1 rounded border border-white/5">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6 gap-5">
            <h3 className="text-lg font-bold text-white/90 m-0">Comments ({comments.length})</h3>
            {user && (
              <form className="flex items-center gap-3" onSubmit={handleAddComment}>
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <input 
                  type="text" 
                  placeholder="Add a public comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-[14px] text-white/90 placeholder:text-white/40 focus:outline-none focus:border-teal-primary transition-colors"
                />
                <button type="submit" disabled={!newComment.trim()} className="bg-teal-primary hover:bg-teal-soft text-black font-semibold rounded-full px-4 py-2 text-sm border-none cursor-pointer transition-colors disabled:opacity-50">Post</button>
              </form>
            )}
            
            <div className="flex flex-col gap-5">
              {comments.length === 0 ? (
                <p className="text-center text-white/40 text-sm py-4 m-0">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3 group">
                    <img src={c.owner?.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <strong className="text-[13px] font-semibold text-white/90">{c.owner?.username}</strong>
                        <span className="text-[11px] text-white/40">{timeAgo(c.createdAt)}</span>
                      </div>
                      
                      {editingCommentId === c._id ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            className="w-full bg-black/40 border border-teal-primary/50 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-teal-primary"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-white/70 text-xs border-none cursor-pointer">Cancel</button>
                            <button onClick={() => handleUpdateComment(c._id)} className="px-3 py-1 bg-teal-primary/20 hover:bg-teal-primary/40 rounded text-teal-soft text-xs font-semibold border border-teal-primary/30 cursor-pointer">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[14px] text-white/80 m-0 leading-relaxed break-words">{c.content}</p>
                          {user && String(user._id) === String(c.owner?._id || c.owner) && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <button onClick={() => startEditing(c)} title="Edit" className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/50 hover:text-white/90 border-none cursor-pointer">
                                <HiOutlinePencil />
                              </button>
                              <button className="p-1 bg-white/5 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400 border-none cursor-pointer" onClick={() => handleDeleteComment(c._id)} title="Delete">
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
        <div className="flex-1 flex flex-col bg-bg-surface border border-white/10 rounded-2xl overflow-hidden h-[600px] lg:h-auto lg:max-h-[900px]">
          <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-black/20">
            <HiOutlineChatAlt2 className="text-xl text-white/70" />
            <h3 className="m-0 text-base font-bold text-white/90 flex-1">Live Chat</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-primary bg-teal-primary/10 px-2 py-1 rounded-full">
              <HiOutlineUserGroup /> {viewerCount}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 h-full text-white/30 gap-2">
                <HiOutlineChatAlt2 className="text-[40px] opacity-50" />
                <p className="m-0 text-sm">No messages yet</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 break-words"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <img
                    src={msg.avatar || '/default-avatar.png'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0 opacity-80"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-white/60 block mb-0.5 leading-tight">{msg.username}</span>
                    <span className="text-[14px] text-white/90 leading-snug">{msg.message}</span>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {user && !streamEnded ? (
            <form className="flex items-center gap-2 p-3 border-t border-white/10 bg-black/20" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={300}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/90 placeholder:text-white/40 focus:outline-none focus:border-teal-primary transition-colors"
              />
              <button type="submit" disabled={!chatInput.trim()} className="bg-teal-primary hover:bg-teal-soft text-black font-semibold rounded-lg px-4 py-2 text-sm border-none cursor-pointer transition-colors disabled:opacity-50">
                Send
              </button>
            </form>
          ) : !user ? (
            <div className="p-4 text-center text-sm text-white/50 border-t border-white/10">
              <Link to="/login" className="text-teal-soft hover:text-teal-primary font-semibold no-underline transition-colors">Sign in</Link> to chat
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
