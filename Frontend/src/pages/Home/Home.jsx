import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import VideoCard from '../../components/VideoCard/VideoCard';
import toast from 'react-hot-toast';
import './Home.css';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'Tech', 'Comedy', 'Sports', 'News'];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTrending = location.pathname === '/trending';
  const query = searchParams.get('query') || '';

  useEffect(() => {
    fetchVideos(1, true);
  }, [query, activeCategory, isTrending]);

  const fetchVideos = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 12 };
      if (query) params.query = query;
      if (activeCategory !== 'All') params.query = (params.query ? params.query + ' ' : '') + activeCategory.toLowerCase();
      // On the trending page, sort by most-watched first
      if (isTrending) {
        params.sortBy = 'views';
        params.sortType = 'desc';
      }
      
      const { data } = await API.get('/video', { params });
      const fetchedVideos = data?.data?.docs || data?.data || [];
      
      if (reset) {
        setVideos(fetchedVideos);
      } else {
        setVideos(prev => [...prev, ...fetchedVideos]);
      }
      setHasMore(fetchedVideos.length === 12);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load videos');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchVideos(page + 1);
    }
  };

  return (
    <div className="page-container">
      <div className="home-header">
        {query && (
          <motion.h1
            className="search-results-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Search results for "<span className="text-gradient">{query}</span>"
          </motion.h1>
        )}
        
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <div className="video-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-thumb" />
              <div className="skeleton-info">
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton-meta">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-sub" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="video-grid">
            {videos.map((video, index) => (
              <VideoCard key={video._id} video={video} index={index} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more">
              <motion.button
                className="btn btn-secondary"
                onClick={loadMore}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </motion.button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>No videos found</h3>
          <p>{query ? 'Try a different search term' : 'Be the first to upload a video!'}</p>
        </div>
      )}
    </div>
  );
}
