import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios.js';
import VideoCard from '../../components/VideoCard/VideoCard.jsx';
import toast from 'react-hot-toast';


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
    <div className="p-6 max-w-[1600px] mx-auto animate-[fadeInUp_0.5s_ease]">

      {/* ── Sticky header with search title + category chips ── */}
      <div
        className="sticky z-10 mb-6 pt-4 pb-0"
        style={{ top: 'var(--header-height)', background: 'var(--bg-primary)' }}
      >
        {query && (
          <motion.h1
            className="text-[22px] font-semibold mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Search results for &quot;<span className="text-gradient">{query}</span>&quot;
          </motion.h1>
        )}

        {/* Category chips — hide native scrollbar */}
        <div className="flex gap-2 overflow-x-auto pb-4 items-center [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-4 py-2 flex flex-col items-center group whitespace-nowrap"
            >
              <span className={`relative z-10 transition-colors duration-300 ${activeCategory === cat ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] group-hover:text-[var(--primary)]'}`}>
                {cat}
              </span>
              <span 
                className={`absolute bottom-0 left-0 h-[2.5px] shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-300 rounded-full ${activeCategory === cat ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'}`}
                style={{ background: 'var(--accent-gradient)' }}
              ></span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Video grid / skeleton / empty state ── */}
      {loading && videos.length === 0 ? (
        /* Skeleton grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              {/* Thumbnail skeleton */}
              <div className="aspect-video rounded-xl bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.04)_75%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
              {/* Info skeleton */}
              <div className="flex gap-3 pt-[14px] items-start">
                <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.04)_75%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-4/5 rounded bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.04)_75%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                  <div className="h-3 w-1/2 rounded bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.04)_75%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
            {videos.map((video, index) => (
              <VideoCard key={video._id} video={video} index={index} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-8">
              <motion.button
                className="inline-flex items-center gap-2 px-5 py-[10px] rounded-lg font-semibold text-sm
                           bg-[rgba(124,58,237,0.15)] text-[var(--accent-secondary)]
                           border border-[var(--border-accent)] cursor-pointer
                           transition-all duration-150 hover:bg-[rgba(124,58,237,0.25)]
                           disabled:opacity-50"
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
        <div className="flex flex-col items-center justify-center py-[60px] px-5 text-center">
          <div className="text-5xl text-[var(--text-muted)] mb-4">🎬</div>
          <h3 className="text-xl font-semibold mb-2">No videos found</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-[400px]">
            {query ? 'Try a different search term' : 'Be the first to upload a video!'}
          </p>
        </div>
      )}
    </div>
  );
}
