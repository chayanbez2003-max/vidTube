import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiOutlinePlay, HiOutlineEye, HiX } from 'react-icons/hi';


export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  // addVideoModal: { playlistId, playlistName } | null
  const [addVideoModal, setAddVideoModal] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  useEffect(() => {
    if (user) fetchPlaylists();
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data } = await API.get(`/playlists/user/${user._id}`);
      setPlaylists(data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylist.name.trim() || !newPlaylist.description.trim()) return;
    try {
      await API.post('/playlists', newPlaylist);
      toast.success('Playlist created!');
      setShowCreate(false);
      setNewPlaylist({ name: '', description: '' });
      fetchPlaylists();
    } catch (err) {
      toast.error('Failed to create playlist');
    }
  };

  // Extract video ID from a URL like /video/<id> or just a raw ID
  const extractVideoId = (input) => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/video\/([a-f0-9]{24})/i);
    if (match) return match[1];
    // Raw 24-char hex ObjectId
    if (/^[a-f0-9]{24}$/i.test(trimmed)) return trimmed;
    return null;
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      toast.error('Please enter a valid video URL or ID');
      return;
    }
    setAddingVideo(true);
    try {
      await API.patch(`/playlists/add/${videoId}/${addVideoModal.playlistId}`);
      toast.success('Video added to playlist!');
      setAddVideoModal(null);
      setVideoUrl('');
      fetchPlaylists();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add video');
    } finally {
      setAddingVideo(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <motion.h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-[var(--text-primary)] m-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <HiOutlineFolderOpen className="text-[var(--primary)]" /> Your <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">Playlists</span>
        </motion.h1>
        <motion.button className="btn-primary !px-4 !py-2.5 flex items-center gap-2 cursor-pointer outline-none border-none text-[14.5px]" onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <HiOutlinePlus className="text-[18px]" /> New Playlist
        </motion.button>
      </div>

      {/* Create playlist modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}>
            <motion.div className="bg-bg-elevated w-full max-w-[500px] border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <h2 className="text-xl font-light text-[var(--text-primary)] m-0 mb-6 border-b border-white/10 pb-4">Create Playlist</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
                  <label>Name</label>
                  <input className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="Playlist name" value={newPlaylist.name}
                    onChange={e => setNewPlaylist({...newPlaylist, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
                  <label>Description</label>
                  <textarea className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors resize-y min-h-[80px]" placeholder="Describe your playlist" rows={3}
                    value={newPlaylist.description}
                    onChange={e => setNewPlaylist({...newPlaylist, description: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button type="button" className="btn-secondary !py-2 !px-4" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary !py-2 !px-6 border-none cursor-pointer outline-none">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add video to playlist modal */}
      <AnimatePresence>
        {addVideoModal && (
          <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>
            <motion.div className="bg-bg-elevated w-full max-w-[500px] border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-light text-[var(--text-primary)] m-0">Add Video to "{addVideoModal.playlistName}"</h2>
                <button className="flex items-center justify-center p-2 rounded-lg bg-bg-surface border border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-border)] transition-colors cursor-pointer outline-none"
                  onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>
                  <HiX className="text-lg" />
                </button>
              </div>
              <form onSubmit={handleAddVideo} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
                  <label>Video URL or ID</label>
                  <input
                    className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors"
                    placeholder="Paste video URL (e.g. /video/abc123) or video ID"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    autoFocus
                  />
                  <p className="text-[12px] text-[var(--text-muted)] m-0 ml-1">
                    Copy the URL from the video page or paste just the video ID.
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button type="button" className="btn-secondary !py-2 !px-4"
                    onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>Cancel</button>
                  <button type="submit" className="btn-primary !py-2 !px-6 border-none cursor-pointer outline-none" disabled={addingVideo || !videoUrl.trim()}>
                    {addingVideo ? 'Adding…' : 'Add Video'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full h-[280px] bg-[var(--glass-border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="video-grid">
          {playlists.map((pl, i) => (
            <motion.div key={pl._id} className="flex flex-col bg-bg-surface border border-white/10 rounded-2xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Link to={`/playlist/${pl._id}`} className="flex flex-col no-underline">
                <div className="relative w-full aspect-video bg-[var(--glass-border)] flex items-center justify-center overflow-hidden">
                  <HiOutlineFolderOpen className="text-4xl text-[var(--border-color)]" />
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 backdrop-blur-md">
                    <HiOutlinePlay /> {pl.totalVideos || 0}
                  </div>
                </div>
                <div className="flex flex-col p-5 gap-2">
                  <h3 className="text-lg font-light text-[var(--text-primary)] truncate m-0 group-hover:text-[var(--primary-soft)] transition-colors">{pl.name}</h3>
                  <p className="text-[13.5px] text-[var(--text-muted)] line-clamp-2 m-0 min-h-[40px] leading-relaxed">{pl.description}</p>
                  <span className="text-[12px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                    <HiOutlineEye className="text-sm" /> {pl.totalViews || 0} views
                  </span>
                </div>
              </Link>
              {/* Add video button — outside the Link so it doesn't navigate */}
              <div className="px-5 pb-5 pt-0 mt-auto">
                <button
                  className="w-full !px-4 !py-2 bg-[var(--glass-border)] hover:bg-teal-primary/10 hover:text-[var(--primary-soft)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-teal-primary/30 flex items-center justify-center gap-2 text-[13px] font-medium rounded-xl cursor-pointer transition-all outline-none"
                  id={`add-video-playlist-${pl._id}`}
                  onClick={() => setAddVideoModal({ playlistId: pl._id, playlistName: pl.name })}
                >
                  <HiOutlinePlus className="text-[16px]" /> Add Video
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] mb-4 opacity-50">📂</div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No playlists yet</h3>
          <p className="text-sm text-[var(--text-muted)]">Create your first playlist to organize videos</p>
        </div>
      )}
    </div>
  );
}

