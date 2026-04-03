import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlineEye, HiOutlineTrash, HiOutlinePlay } from 'react-icons/hi';
import VideoCard from '../../components/VideoCard/VideoCard';
import { formatViews, timeAgo } from '../../utils/formatters';
import './Playlist.css';

export default function Playlist() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      const { data } = await API.get(`/playlists/${playlistId}`);
      setPlaylist(data.data);
    } catch (err) {
      toast.error('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!window.confirm('Remove this video from the playlist?')) return;
    try {
      await API.patch(`/playlists/remove/${videoId}/${playlistId}`);
      toast.success('Video removed from playlist');
      // Update local state without refetching the whole thing
      setPlaylist(prev => ({
        ...prev,
        videos: prev.videos.filter(v => String(v._id) !== String(videoId)),
        totalVideos: prev.totalVideos - 1
      }));
    } catch (err) {
      toast.error('Failed to remove video');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 24 }} />
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card"><div className="skeleton skeleton-thumb" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Playlist not found</h3>
        </div>
      </div>
    );
  }

  const isOwner = String(user?._id) === String(playlist.owner?._id);

  return (
    <div className="page-container playlist-detail-page">
      {/* Playlist Header Info */}
      <div className="playlist-detail-header glass-card">
        <div className="pd-thumb">
          {playlist.videos?.length > 0 ? (
            <img src={playlist.videos[0].thumbnail?.url || playlist.videos[0].thumbnail} alt={playlist.name} />
          ) : (
            <div className="pd-thumb-empty"><HiOutlineFolderOpen /></div>
          )}
          <div className="pd-overlay-count">
            <HiOutlinePlay /> {playlist.totalVideos || 0}
          </div>
        </div>
        
        <div className="pd-info">
          <h1 className="pd-title">{playlist.name}</h1>
          <p className="pd-desc">{playlist.description}</p>
          
          <div className="pd-meta">
            <Link to={`/channel/${playlist.owner?.username}`} className="pd-owner">
              <img src={playlist.owner?.avatar?.url || playlist.owner?.avatar} alt="" className="avatar avatar-sm" />
              <span>{playlist.owner?.fullName || playlist.owner?.username}</span>
            </Link>
            <div className="pd-stats">
              <span>{playlist.totalVideos || 0} videos</span>
              •
              <span>{formatViews(playlist.totalViews || 0)} views</span>
              •
              <span>Updated {timeAgo(playlist.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="pd-videos-section">
        <h2 style={{ marginBottom: 20 }}>Playlist Videos</h2>
        {playlist.videos?.length > 0 ? (
          <div className="video-grid">
            {playlist.videos.map((video, index) => (
              <div key={video._id} className="pd-video-wrapper">
                <VideoCard video={video} index={index} />
                {isOwner && (
                  <button 
                    className="btn btn-ghost btn-sm pd-remove-video"
                    onClick={() => handleRemoveVideo(video._id)}
                    title="Remove from playlist"
                  >
                    <HiOutlineTrash className="text-danger" /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No videos in this playlist</h3>
            <p>Add some videos to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
