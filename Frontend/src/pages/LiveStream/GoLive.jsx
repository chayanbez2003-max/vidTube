import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineStatusOnline, HiOutlineVideoCamera, HiOutlineEye,
  HiOutlineChatAlt2, HiOutlineTag, HiOutlineStop, HiOutlineUserGroup,
  HiOutlineThumbUp, HiThumbUp, HiOutlinePencil, HiOutlineTrash,
  HiOutlinePhotograph
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/formatters';


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
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
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
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
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

  // Timer for stream duration and attach stream to video
  useEffect(() => {
    if (step === 'live') {
      if (videoRef.current && mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
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
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const { data } = await API.post('/streams/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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

      // Start recording
      recordedChunksRef.current = [];
      try {
        const options = { mimeType: 'video/webm' };
        const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000); // Collect 1s chunks
      } catch (err) {
        console.error('Error starting MediaRecorder:', err);
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
      toast('Ending stream and saving recording...', { duration: 5000, icon: 'ℹ️' });

      const stopRecording = () => new Promise((resolve) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
          resolve();
          return;
        }
        mediaRecorderRef.current.onstop = () => {
          // Wait 150ms so the final ondataavailable chunk has time to fire
          setTimeout(resolve, 150);
        };
        try {
          // Explicitly flush the current partial buffer before stopping
          if (mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.requestData();
          }
        } catch (e) {
          console.warn("Could not request data from MediaRecorder:", e);
        }
        mediaRecorderRef.current.stop();
      });

      await stopRecording();

      // Stop camera after recording is fully flushed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      if (blob.size > 0) {
        formData.append('videoFile', blob, 'stream-record.webm');
      }

      const uploadToastId = 'upload-progress';
      await API.post(`/streams/end/${stream._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10 * 60 * 1000, // 10-minute timeout for large recordings
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            toast.loading(`Uploading recording... ${pct}%`, { id: uploadToastId });
          }
        },
      });
      toast.dismiss(uploadToastId);

      toast.success('Stream ended and saved successfully!');
    } catch (error) {
      console.error('End stream error:', error?.response?.data || error?.message || error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to end stream.');
    } finally {
      // ALWAYS notify viewers and disconnect, even if upload fails
      if (socket && stream) {
        socket.emit('stream:end', stream._id);
        socket.emit('stream:leave', stream._id);
      }
      navigate('/');
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
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
        <motion.div
          className="max-w-[800px] mx-auto bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 flex flex-col gap-8 mt-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center gap-2 pb-6 border-b border-[var(--border-color)]">
            <HiOutlineStatusOnline className="text-[56px] text-live animate-pulse" />
            <h1 className="text-3xl font-light text-[var(--text-primary)] m-0">Go <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">Live</span></h1>
            <p className="text-[15px] text-[var(--text-muted)] m-0 max-w-[400px]">Set up your stream and start broadcasting to your audience</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)]">
              <label>Stream Title *</label>
              <input
                type="text"
                className="w-full bg-slate-100 border border-[var(--border-color)] rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                placeholder="What are you streaming today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)]">
              <label>Description</label>
              <textarea
                className="w-full bg-slate-100 border border-[var(--border-color)] rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-y min-h-[100px]"
                placeholder="Tell viewers what your stream is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)]">
                <label>Category</label>
                <select
                  className="w-full bg-slate-100 border border-[var(--border-color)] rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-white text-[var(--text-primary)]">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)]">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-slate-100 border border-[var(--border-color)] rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="gaming, minecraft, live"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)]">
              <label>Thumbnail (optional)</label>
              <label className="thumbnail-upload-area" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f1f5f9', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setThumbnail(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <HiOutlinePhotograph style={{ fontSize: '24px', color: 'var(--text-muted)' }} />
                )}
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {thumbnail ? thumbnail.name : 'Click to upload a thumbnail image'}
                </span>
              </label>
            </div>

            <motion.button
              className="btn-primary mt-4 !py-3.5 !text-[15px] flex items-center justify-center gap-2 cursor-pointer outline-none border-none font-bold"
              onClick={handleGoLive}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Starting Stream...
                </>
              ) : (
                <>
                  <HiOutlineVideoCamera className="text-[20px]" />
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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* Video Area */}
        <div className="flex-[2] flex flex-col gap-6 min-w-0">
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[var(--border-color)] group">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Live overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100 lg:opacity-100">
              <div className="badge-live">
                <span className="w-2 h-2 rounded-full bg-live animate-[livePulse_2s_infinite]" />
                <span>LIVE</span>
              </div>
              <div className="flex gap-3">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md text-[var(--text-primary)] text-sm font-medium flex items-center gap-1.5 border border-white/10">
                  <HiOutlineEye /> {viewerCount}
                </span>
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md text-[var(--text-primary)] text-sm font-medium flex items-center gap-1.5 border border-white/10">
                  ⏱ {formatTime(elapsedTime)}
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100 lg:opacity-100">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight m-0 mb-3 drop-shadow-md">{stream?.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-teal-primary/20 text-[var(--primary)] border border-teal-primary/30 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md">{category}</span>
                {stream?.tags?.map(tag => (
                  <span key={tag} className="text-xs text-[var(--text-secondary)] font-medium bg-white/10 px-2 py-1 rounded backdrop-blur-sm border border-[var(--border-color)]">#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-sm">
            <motion.button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all font-medium text-sm cursor-pointer outline-none ${isLiked ? '!text-[var(--primary)] !bg-[var(--primary)]/10 !border-[var(--primary)]/20' : 'border-[var(--border-color)] bg-slate-100 hover:bg-slate-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={handleToggleLike}
              whileTap={{ scale: 0.9 }}
            >
              {isLiked ? <HiThumbUp className="text-[18px]" /> : <HiOutlineThumbUp className="text-[18px]" />}
              <span>{likesCount > 0 ? likesCount : 'Like'}</span>
            </motion.button>

            <motion.button
              className="btn-danger flex items-center justify-center gap-2 px-6 py-2.5 shadow-none outline-none cursor-pointer border-none font-medium text-sm"
              onClick={handleEndStream}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineStop className="text-[18px]" /> End Stream
            </motion.button>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 md:p-6 gap-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">Comments ({comments.length})</h3>
            <form className="flex items-center gap-3 w-full" onSubmit={handleAddComment}>
              <img src={user?.avatar?.url || user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <input
                type="text"
                placeholder="Add a public comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-100 border border-[var(--border-color)] rounded-full px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
              <button type="submit" disabled={!newComment.trim()} className="bg-teal-primary hover:bg-teal-soft text-black font-semibold rounded-full px-4 py-2 text-sm border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Post</button>
            </form>

            <div className="flex flex-col gap-5">
              {comments.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] text-sm py-4 m-0">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3 group">
                    <img src={c.owner?.avatar?.url || c.owner?.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <strong className="text-[13px] font-semibold text-[var(--text-primary)]">{c.owner?.username}</strong>
                        <span className="text-[11px] text-[var(--text-muted)]">{timeAgo(c.createdAt)}</span>
                      </div>

                      {editingCommentId === c._id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            className="w-full bg-slate-100 border border-[var(--primary)]/50 text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--primary)]"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCommentId(null)} className="p-1 px-3 bg-slate-100 hover:bg-slate-200 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-none cursor-pointer text-xs">Cancel</button>
                            <button onClick={() => handleUpdateComment(c._id)} className="p-1 px-3 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 rounded text-[var(--primary)] transition-colors border border-[var(--primary)]/30 cursor-pointer text-xs font-semibold">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[14px] text-[var(--text-primary)] m-0 leading-relaxed break-words">{c.content}</p>
                          {String(user?._id) === String(c.owner?._id || c.owner) && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <button onClick={() => { setEditingCommentId(c._id); setEditContent(c.content); }} title="Edit" className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border-none cursor-pointer">
                                <HiOutlinePencil />
                              </button>
                              <button className="p-1 bg-slate-100 hover:bg-red-50 rounded text-[var(--text-muted)] hover:text-red-500 transition-colors border-none cursor-pointer" onClick={() => handleDeleteComment(c._id)} title="Delete">
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
        <div className="flex-1 flex flex-col bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden h-[600px] lg:h-auto lg:max-h-[800px] shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--border-color)] bg-slate-50">
            <HiOutlineChatAlt2 className="text-xl text-[var(--text-secondary)]" />
            <h3 className="m-0 text-base font-bold text-[var(--text-primary)] flex-1">Live Chat</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] bg-teal-primary/10 px-2 py-1 rounded-full">
              <HiOutlineUserGroup /> {viewerCount}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-transparent pt-6">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 h-full text-[var(--text-muted)] gap-2">
                <HiOutlineChatAlt2 className="text-[40px] opacity-50" />
                <p className="m-0 text-sm">Chat messages will appear here</p>
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
                    <span className="text-[12px] font-bold text-[var(--text-secondary)] block mb-0.5 leading-tight">{msg.username}</span>
                    <span className="text-[14px] text-[var(--text-primary)] leading-snug">{msg.message}</span>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="flex items-center gap-2 p-3 pb-4 border-t border-[var(--border-color)] bg-slate-50" onSubmit={handleSendChat}>
            <input
              type="text"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={300}
              className="flex-1 bg-slate-100 border border-[var(--border-color)] rounded-lg px-3 py-2 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button type="submit" disabled={!chatInput.trim()} className="bg-teal-primary hover:bg-teal-soft text-black font-semibold rounded-lg px-4 py-2 text-sm border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
