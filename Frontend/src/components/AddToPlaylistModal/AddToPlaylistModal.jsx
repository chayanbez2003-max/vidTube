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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[420px] rounded-2xl overflow-hidden flex flex-col max-h-[80vh]
                     bg-white border border-slate-200 shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 bg-slate-50">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 m-0">
              <HiOutlineFolderOpen className="text-sky-500 text-lg" /> Save to Playlist
            </h2>
            <button className="bg-slate-200/60 border-none text-slate-500 cursor-pointer p-1.5 flex items-center rounded-xl hover:text-slate-800 hover:bg-slate-200 transition-colors" onClick={onClose}>
              <HiX />
            </button>
          </div>

          {/* Playlist list */}
          <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-1.5">
            {loading ? (
              <div className="text-center text-slate-400 py-8 px-4 text-sm font-medium">Loading playlists…</div>
            ) : playlists.length === 0 ? (
              <div className="text-center text-slate-500 py-8 px-4 text-sm font-medium">No playlists yet. Create one below!</div>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl._id}
                  className={`flex items-center gap-3 w-full p-3 border rounded-xl text-left cursor-pointer transition-all ${
                    added[pl._id]
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                  }`}
                  onClick={() => !added[pl._id] && handleAddToPlaylist(pl._id)}
                  disabled={adding === pl._id}
                >
                  <span className={`text-[19px] shrink-0 ${added[pl._id] ? 'text-emerald-500' : 'text-sky-500'}`}><HiOutlineFolderOpen /></span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate text-slate-900">{pl.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{pl.totalVideos || 0} videos</span>
                  </span>
                  {added[pl._id] && <HiCheck className="text-emerald-600 text-[20px] shrink-0 font-bold" />}
                  {adding === pl._id && (
                    <span className="w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer — create new playlist */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            {showCreate ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
                  placeholder="Playlist name"
                  value={newPlaylist.name}
                  onChange={e => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  autoFocus
                />
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
                  placeholder="Description (optional)"
                  value={newPlaylist.description}
                  onChange={e => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                />
                <div className="flex gap-2 justify-end mt-1">
                  <button type="button" className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-200/70 hover:bg-slate-200 transition-colors border-none cursor-pointer" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all border-none cursor-pointer shadow-sm disabled:opacity-50" disabled={creating}>
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 rounded-xl text-slate-700 hover:text-sky-600 font-semibold cursor-pointer text-xs transition-all shadow-sm"
                onClick={() => setShowCreate(true)}
              >
                <HiOutlinePlus className="text-sm" /> Create New Playlist
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
