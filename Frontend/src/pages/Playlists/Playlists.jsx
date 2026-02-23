import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlinePlus, HiOutlinePlay, HiOutlineEye } from 'react-icons/hi';
import './Playlists.css';

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });

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
