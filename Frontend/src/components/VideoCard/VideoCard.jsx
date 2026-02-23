import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineEye } from 'react-icons/hi';
import './VideoCard.css';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
  if (!views) return '0 views';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export default function VideoCard({ video, index = 0 }) {
  const thumbnailUrl = video?.thumbnail?.url || video?.thumbnail;
  const ownerAvatar = video?.ownerDetails?.avatar?.url || video?.ownerDetails?.avatar || video?.owner?.avatar?.url || video?.owner?.avatar || '';
  const ownerUsername = video?.ownerDetails?.username || video?.owner?.username || 'Unknown';
  const createdAt = video?.createdAt;
  const createdAtStr = typeof createdAt === 'object' && createdAt?.year 
    ? `${createdAt.year}-${createdAt.month}-${createdAt.day}` 
    : createdAt;

  return (
    <motion.div
      className="video-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/video/${video._id}`} className="video-card-link" id={`video-card-${video._id}`}>
        <div className="video-thumbnail">
          <img src={thumbnailUrl} alt={video.title} loading="lazy" />
          <div className="video-duration">{formatDuration(video.duration)}</div>
          <div className="video-overlay">
            <div className="play-icon">▶</div>
          </div>
        </div>
        <div className="video-info">
          {ownerAvatar && (
            <img src={ownerAvatar} alt={ownerUsername} className="avatar avatar-sm video-avatar" />
          )}
          <div className="video-meta">
            <h3 className="video-title">{video.title}</h3>
            <p className="video-channel">{ownerUsername}</p>
            <p className="video-stats">
              <span><HiOutlineEye /> {formatViews(video.views)}</span>
              {createdAtStr && <span>• {timeAgo(createdAtStr)}</span>}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
