import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineEye, HiOutlineTrash, HiOutlineBookmark } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { formatDuration, formatViews, timeAgo } from '../../utils/formatters';
import AddToPlaylistModal from '../AddToPlaylistModal/AddToPlaylistModal';

export default function VideoCard({ video, index = 0, isOwner = false, onDelete }) {
  const { user } = useAuth();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      onDelete && onDelete(video._id);
    }
  };

  const handleSaveToPlaylist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPlaylistModal(true);
  };

  const thumbnailUrl = video?.thumbnail?.url || video?.thumbnail;
  const ownerAvatar = video?.ownerDetails?.avatar?.url || video?.ownerDetails?.avatar || video?.owner?.avatar?.url || video?.owner?.avatar || '';
  const ownerUsername = video?.ownerDetails?.username || video?.owner?.username || 'Unknown';
  const createdAt = video?.createdAt;
  const createdAtStr = typeof createdAt === 'object' && createdAt?.year
    ? `${createdAt.year}-${createdAt.month}-${createdAt.day}`
    : createdAt;

  return (
    <>
      <motion.div
        className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/10
                   flex flex-col transition-all duration-300
                   hover:border-[rgba(29,184,168,0.35)] hover:shadow-[0_16px_48px_rgba(13,11,24,0.7),0_0_0_1px_rgba(64,255,232,0.10)]
                   group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -4 }}
      >
        <Link
          to={`/video/${video._id}`}
          className="no-underline text-inherit flex flex-col h-full"
          id={`video-card-${video._id}`}
        >
          {/* ── Thumbnail ── */}
          <div className="relative aspect-video overflow-hidden bg-white/[0.03] flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
            />

            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 bg-black/85 text-white px-2 py-[2px]
                            rounded text-[12px] font-semibold tracking-[0.3px]">
              {formatDuration(video.duration)}
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center
                              text-[18px] text-white scale-80 group-hover:scale-100
                              transition-transform duration-150
                              shadow-[0_0_20px_rgba(29,184,168,0.4)]
                              bg-gradient-to-br from-teal to-teal-soft">
                ▶
              </div>
            </div>

            {/* Delete button (owner only) */}
            {isOwner && (
              <button
                className="absolute top-2 right-2 w-[34px] h-[34px] rounded-full
                           bg-red-500/85 border-none text-white flex items-center justify-center
                           text-base cursor-pointer backdrop-blur-sm z-10
                           opacity-0 scale-80 group-hover:opacity-100 group-hover:scale-100
                           transition-all duration-200
                           hover:bg-red-600 hover:scale-110 hover:shadow-[0_4px_14px_rgba(239,68,68,0.5)]"
                onClick={handleDelete}
                title="Delete video"
                id={`delete-video-${video._id}`}
              >
                <HiOutlineTrash />
              </button>
            )}

            {/* Save to playlist button */}
            {user && (
              <button
                className="absolute bottom-2 left-2 w-[34px] h-[34px] rounded-full
                           bg-teal/80 border-none text-white flex items-center justify-center
                           text-base cursor-pointer backdrop-blur-sm z-10
                           opacity-0 scale-80 group-hover:opacity-100 group-hover:scale-100
                           transition-all duration-200
                           hover:bg-teal-soft hover:scale-110 hover:shadow-[0_4px_14px_rgba(29,184,168,0.5)]"
                onClick={handleSaveToPlaylist}
                title="Save to playlist"
                id={`save-playlist-${video._id}`}
              >
                <HiOutlineBookmark />
              </button>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex gap-3 p-[14px] items-start flex-1">
            {ownerAvatar && (
              <img
                src={ownerAvatar}
                alt={ownerUsername}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-[2px]
                           border-2 border-white/10 hover:border-teal transition-colors"
              />
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
              <h3 className="text-[14px] font-medium leading-[1.4] m-0
                             overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2]
                             [-webkit-box-orient:vertical]">
                {video.title}
              </h3>
              <p className="text-[13px] text-white/70 m-0 capitalize leading-[1.4]
                            hover:text-white transition-colors">
                {ownerUsername}
              </p>
              <p className="flex items-center gap-1 text-[12px] text-white/50 m-0 flex-wrap">
                <span className="inline-flex items-center gap-[3px]">
                  <HiOutlineEye /> {formatViews(video.views)} views
                </span>
                {createdAtStr && (
                  <span className="inline-flex items-center gap-[3px] before:content-['•'] before:mr-1 before:text-white/50">
                    {timeAgo(createdAtStr)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {showPlaylistModal && (
        <AddToPlaylistModal
          videoId={video._id}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </>
  );
}
