import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiX, HiCheck } from 'react-icons/hi';

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
  const [adding, setAdding] = useState(null);
  const [added, setAdded] = useState({});
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
        className="fixed inset-0 bg-[rgba(13,11,24,0.82)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[420px] rounded-2xl overflow-hidden flex flex-col max-h-[80vh]
                     bg-bg-elevated border border-white/10
                     shadow-[0_24px_80px_rgba(13,11,24,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]
                     bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(205,184,232,0.06)_0%,transparent_70%)]"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-[18px_20px] border-b border-white/10">
            <h2 className="flex items-center gap-2 text-base font-light tracking-tight m-0">
              <HiOutlineFolderOpen /> Save to Playlist
            </h2>
            <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer text-[20px] p-1 flex items-center rounded-full hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors" onClick={onClose}>
              <HiX />
            </button>
          </div>

          {/* Playlist list */}
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="text-center text-[var(--text-muted)] py-6 px-4 text-sm">Loading playlists…</div>
            ) : playlists.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-6 px-4 text-sm">No playlists yet. Create one below!</div>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl._id}
                  className={`flex items-center gap-3 w-full p-3 bg-transparent border rounded-xl text-[var(--text-primary)] text-left cursor-pointer transition-all ${
                    added[pl._id]
                      ? 'border-teal bg-teal-mist'
                      : 'border-transparent hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                  onClick={() => !added[pl._id] && handleAddToPlaylist(pl._id)}
                  disabled={adding === pl._id}
                >
                  <span className="text-[18px] text-teal shrink-0"><HiOutlineFolderOpen /></span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{pl.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{pl.totalVideos || 0} videos</span>
                  </span>
                  {added[pl._id] && <HiCheck className="text-badge-green text-[18px] shrink-0" />}
                  {adding === pl._id && (
                    <span className="w-4 h-4 border-2 border-[rgba(29,184,168,0.15)] border-t-teal rounded-full animate-spin shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer — create new playlist */}
          <div className="p-3 border-t border-white/10">
            {showCreate ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-2.5">
                <input
                  className="input-field !text-[13px] !p-[10px_12px]"
                  placeholder="Playlist name"
                  value={newPlaylist.name}
                  onChange={e => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                />
                <input
                  className="input-field !text-[13px] !p-[10px_12px]"
                  placeholder="Description"
                  value={newPlaylist.description}
                  onChange={e => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-ghost !py-1 !px-3 !text-xs" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary !py-1 !px-3 !text-xs" disabled={creating}>
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="flex items-center gap-2 w-full p-[10px_14px] bg-transparent border border-dashed border-white/15 rounded-xl text-[var(--text-secondary)] cursor-pointer text-sm transition-all hover:text-[var(--text-primary)] hover:border-teal hover:bg-teal-mist"
                onClick={() => setShowCreate(true)}
              >
                <HiOutlinePlus /> New Playlist
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
