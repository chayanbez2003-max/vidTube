import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiOutlinePlay, HiOutlineEye, HiX } from 'react-icons/hi';
import './Playlists.css';

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
    <div className="page-container">
      <div className="playlists-header">
        <motion.h1 className="page-title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <HiOutlineFolderOpen /> Your <span className="text-gradient">Playlists</span>
        </motion.h1>
        <motion.button className="btn btn-primary" onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <HiOutlinePlus /> New Playlist
        </motion.button>
      </div>

      {/* Create playlist modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <h2 style={{ marginBottom: 20 }}>Create Playlist</h2>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label>Name</label>
                  <input className="input-field" placeholder="Playlist name" value={newPlaylist.name}
                    onChange={e => setNewPlaylist({...newPlaylist, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea className="input-field" placeholder="Describe your playlist" rows={3}
                    value={newPlaylist.description}
                    onChange={e => setNewPlaylist({...newPlaylist, description: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add video to playlist modal */}
      <AnimatePresence>
        {addVideoModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2>Add Video to "{addVideoModal.playlistName}"</h2>
                <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                  onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>
                  <HiX />
                </button>
              </div>
              <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label>Video URL or ID</label>
                  <input
                    className="input-field"
                    placeholder="Paste video URL (e.g. /video/abc123) or video ID"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    autoFocus
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Copy the URL from the video page or paste just the video ID.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost"
                    onClick={() => { setAddVideoModal(null); setVideoUrl(''); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={addingVideo || !videoUrl.trim()}>
                    {addingVideo ? 'Adding…' : 'Add Video'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="playlists-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton playlist-skeleton" />
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="playlists-grid">
          {playlists.map((pl, i) => (
            <motion.div key={pl._id} className="playlist-card glass-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Link to={`/playlist/${pl._id}`} className="playlist-card-link">
                <div className="playlist-thumb">
                  <div className="playlist-count"><HiOutlinePlay /> {pl.totalVideos || 0}</div>
                </div>
                <div className="playlist-info">
                  <h3>{pl.name}</h3>
                  <p>{pl.description}</p>
                  <span className="playlist-meta">
                    <HiOutlineEye /> {pl.totalViews || 0} views
                  </span>
                </div>
              </Link>
              {/* Add video button — outside the Link so it doesn't navigate */}
              <div className="playlist-actions">
                <button
                  className="btn btn-ghost btn-sm playlist-add-btn"
                  id={`add-video-playlist-${pl._id}`}
                  onClick={() => setAddVideoModal({ playlistId: pl._id, playlistName: pl.name })}
                >
                  <HiOutlinePlus /> Add Video
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>No playlists yet</h3>
          <p>Create your first playlist to organize videos</p>
        </div>
      )}
    </div>
  );
}

