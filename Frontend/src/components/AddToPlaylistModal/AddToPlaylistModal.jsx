import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiX, HiCheck } from 'react-icons/hi';
import './AddToPlaylistModal.css';

/**
 * AddToPlaylistModal
 * Props:
 *   videoId  - the video to add
 *   onClose  - callback to close the modal
 */
export default function AddToPlaylistModal({ videoId, onClose }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null); // playlistId being added
  const [added, setAdded] = useState({}); // { playlistId: true } for success badge
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) fetchPlaylists();
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data } = await API.get(`/playlists/user/${user._id}`);
      setPlaylists(data.data || []);
    } catch (e) {
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (adding) return;
    setAdding(playlistId);
    try {
      await API.patch(`/playlists/add/${videoId}/${playlistId}`);
      setAdded(prev => ({ ...prev, [playlistId]: true }));
      toast.success('Added to playlist!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to playlist');
    } finally {
      setAdding(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylist.name.trim() || !newPlaylist.description.trim()) return;
    setCreating(true);
    try {
      await API.post('/playlists', newPlaylist);
      toast.success('Playlist created!');
      setNewPlaylist({ name: '', description: '' });
      setShowCreate(false);
      await fetchPlaylists();
    } catch (err) {
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="atp-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="atp-modal glass-card"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="atp-header">
            <h2><HiOutlineFolderOpen /> Save to Playlist</h2>
            <button className="atp-close" onClick={onClose}><HiX /></button>
          </div>

          {/* Playlist list */}
          <div className="atp-list">
            {loading ? (
              <div className="atp-empty">Loading playlists…</div>
            ) : playlists.length === 0 ? (
              <div className="atp-empty">No playlists yet. Create one below!</div>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl._id}
                  className={`atp-item ${added[pl._id] ? 'atp-item--added' : ''}`}
                  onClick={() => !added[pl._id] && handleAddToPlaylist(pl._id)}
                  disabled={adding === pl._id}
                >
                  <span className="atp-item-icon"><HiOutlineFolderOpen /></span>
                  <span className="atp-item-info">
                    <span className="atp-item-name">{pl.name}</span>
                    <span className="atp-item-count">{pl.totalVideos || 0} videos</span>
                  </span>
                  {added[pl._id] && <HiCheck className="atp-check" />}
                  {adding === pl._id && <span className="atp-spinner" />}
                </button>
              ))
            )}
          </div>

          {/* Create new playlist */}
          <div className="atp-footer">
            {showCreate ? (
              <form onSubmit={handleCreate} className="atp-create-form">
                <input
                  className="input-field atp-input"
                  placeholder="Playlist name"
                  value={newPlaylist.name}
                  onChange={e => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                />
                <input
                  className="input-field atp-input"
                  placeholder="Description"
                  value={newPlaylist.description}
                  onChange={e => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                />
                <div className="atp-create-actions">
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button className="atp-new-btn" onClick={() => setShowCreate(true)}>
                <HiOutlinePlus /> New Playlist
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
