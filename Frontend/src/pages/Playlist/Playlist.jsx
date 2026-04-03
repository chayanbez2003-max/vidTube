import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineFolderOpen, HiOutlineEye, HiOutlineTrash, HiOutlinePlay } from 'react-icons/hi';
import VideoCard from '../../components/VideoCard/VideoCard';
import { formatViews, timeAgo } from '../../utils/formatters';


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
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8 flex flex-col gap-8">
        <div className="w-full h-[200px] rounded-2xl bg-white/5 animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3"><div className="w-full aspect-video rounded-xl bg-white/5 animate-pulse" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8 flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <h3 className="text-xl font-semibold mb-2 text-white/90">Playlist not found</h3>
        </div>
      </div>
    );
  }

  const isOwner = String(user?._id) === String(playlist.owner?._id);

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8 flex flex-col gap-8">
      {/* Playlist Header Info */}
      <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-bg-surface border border-white/10 rounded-2xl">
        <div className="relative w-full md:w-[320px] aspect-video rounded-xl overflow-hidden shrink-0 bg-white/5">
          {playlist.videos?.length > 0 ? (
            <img src={playlist.videos[0].thumbnail?.url || playlist.videos[0].thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5"><HiOutlineFolderOpen className="text-5xl text-white/20" /></div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm">
            <HiOutlinePlay /> {playlist.totalVideos || 0}
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl md:text-3xl font-light text-white/90 m-0 mb-3">{playlist.name}</h1>
          <p className="text-[15px] text-white/60 leading-relaxed m-0 mb-6 flex-1">{playlist.description}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-5 border-t border-white/10">
            <Link to={`/channel/${playlist.owner?.username}`} className="flex items-center gap-3 no-underline text-white/90 font-medium hover:text-teal-soft transition-colors">
              <img src={playlist.owner?.avatar?.url || playlist.owner?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              <span>{playlist.owner?.fullName || playlist.owner?.username}</span>
            </Link>
            <div className="flex items-center gap-2 flex-wrap text-sm text-white/50">
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
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-light text-white/90 m-0">Playlist Videos</h2>
        {playlist.videos?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {playlist.videos.map((video, index) => (
              <div key={video._id} className="relative group">
                <VideoCard video={video} index={index} />
                {isOwner && (
                  <button 
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center gap-1.5 backdrop-blur-md px-3 py-1.5 border border-white/10 z-10 transition-all rounded text-xs font-medium cursor-pointer"
                    onClick={() => handleRemoveVideo(video._id)}
                    title="Remove from playlist"
                  >
                    <HiOutlineTrash className="text-red-400 text-sm" /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
            <div className="text-[48px] mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-semibold mb-2 text-white/90">No videos in this playlist</h3>
            <p className="text-sm text-white/50">Add some videos to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
