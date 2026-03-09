import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineEye } from 'react-icons/hi';
import { formatDuration, formatViews, timeAgo } from '../../utils/formatters';
import './VideoCard.css';



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
              <span><HiOutlineEye /> {formatViews(video.views)} views</span>
              {createdAtStr && <span>{timeAgo(createdAtStr)}</span>}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
