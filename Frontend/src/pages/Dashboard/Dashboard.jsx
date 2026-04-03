import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  HiOutlineEye, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineThumbUp, HiOutlineChatAlt2, HiOutlineVideoCamera,
  HiOutlineTrendingUp, HiOutlineChartBar, HiOutlineRefresh
} from 'react-icons/hi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const CHART_COLORS = ['#7c3aed', '#a855f7', '#c084fc', '#06b6d4', '#3b82f6', '#10b981'];

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatWatchTime(hours) {
  if (!hours) return '0h';
  if (hours >= 24) return Math.round(hours / 24) + 'd ' + (hours % 24) + 'h';
  return hours + 'h';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="dash-tooltip">
        <p className="dash-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="dash-tooltip-value" style={{ color: entry.color }}>
            {entry.name}: <strong>{formatNumber(entry.value)}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/analytics/channel');
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed!');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="dash-loading">
          <div className="dash-loading-spinner" />
          <p>Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No analytics available</h3>
          <p>Start uploading videos to see your channel analytics.</p>
        </div>
      </div>
    );
  }

  const { overview, subscriberGrowth, viewsOverTime, topVideos } = analytics;

  // Stat cards data
  const statCards = [
    {
      label: 'Total Views',
      value: formatNumber(overview.totalViews),
      icon: <HiOutlineEye />,
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.05))',
      border: 'rgba(124,58,237,0.3)',
    },
    {
      label: 'Subscribers',
      value: formatNumber(overview.totalSubscribers),
      icon: <HiOutlineUserGroup />,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
      border: 'rgba(6,182,212,0.3)',
    },
    {
      label: 'Watch Time',
      value: formatWatchTime(overview.totalWatchTimeHours),
      icon: <HiOutlineClock />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
      border: 'rgba(16,185,129,0.3)',
    },
    {
      label: 'Total Likes',
      value: formatNumber(overview.totalLikes),
      icon: <HiOutlineThumbUp />,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))',
      border: 'rgba(236,72,153,0.3)',
    },
    {
      label: 'Comments',
      value: formatNumber(overview.totalComments),
      icon: <HiOutlineChatAlt2 />,
      color: '#f97316',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
      border: 'rgba(249,115,22,0.3)',
    },
    {
      label: 'Engagement Rate',
      value: overview.engagementRate + '%',
      icon: <HiOutlineTrendingUp />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
      border: 'rgba(59,130,246,0.3)',
    },
  ];

  // Generate pie chart data from stat cards
  const pieData = [
    { name: 'Views', value: overview.totalViews || 1 },
    { name: 'Likes', value: overview.totalLikes || 1 },
    { name: 'Comments', value: overview.totalComments || 1 },
    { name: 'Subscribers', value: overview.totalSubscribers || 1 },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <motion.h1
            className="dash-title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HiOutlineChartBar className="dash-title-icon" />
            Creator <span className="text-gradient">Dashboard</span>
          </motion.h1>
          <p className="dash-subtitle">
            Welcome back, <strong>{user?.fullName || user?.username}</strong> — here's how your channel is performing.
          </p>
        </div>
        <motion.button
          className="btn btn-secondary dash-refresh-btn"
          onClick={handleRefresh}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={refreshing}
        >
          <HiOutlineRefresh className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="dash-stat-card"
            style={{
              background: stat.gradient,
              borderColor: stat.border,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -4, boxShadow: `0 12px 30px ${stat.border}` }}
          >
            <div className="dash-stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div className="dash-stat-info">
              <p className="dash-stat-label">{stat.label}</p>
              <h2 className="dash-stat-value" style={{ color: stat.color }}>{stat.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="dash-charts-grid">
        {/* Subscriber Growth Chart */}
        <motion.div
          className="dash-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="dash-chart-header">
            <h3><HiOutlineUserGroup /> Subscriber Growth</h3>
            <span className="dash-chart-badge">Last 30 days</span>
          </div>
          {subscriberGrowth && subscriberGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={subscriberGrowth}>
                <defs>
                  <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => val?.slice(5) || val}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="New Subscribers"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#subGradient)"
                  dot={{ fill: '#06b6d4', r: 3 }}
                  activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#0f0f0f' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-chart-empty">
              <HiOutlineUserGroup />
              <p>No subscriber data yet</p>
            </div>
          )}
        </motion.div>

        {/* Views Over Time Chart */}
        <motion.div
          className="dash-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="dash-chart-header">
            <h3><HiOutlineEye /> Views Over Time</h3>
            <span className="dash-chart-badge">Last 30 days</span>
          </div>
          {viewsOverTime && viewsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={viewsOverTime}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => val?.slice(5) || val}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="views"
                  name="Views"
                  fill="url(#viewsGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-chart-empty">
              <HiOutlineEye />
              <p>No view data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Top Videos + Engagement Pie */}
      <div className="dash-bottom-grid">
        {/* Top Performing Videos */}
        <motion.div
          className="dash-chart-card dash-top-videos"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="dash-chart-header">
            <h3><HiOutlineVideoCamera /> Top Performing Videos</h3>
          </div>
          {topVideos && topVideos.length > 0 ? (
            <div className="dash-top-videos-list">
              {topVideos.map((video, index) => (
                <motion.div
                  key={video._id}
                  className="dash-top-video-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.08 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="dash-top-video-rank">
                    <span className={`rank-num rank-${index + 1}`}>#{index + 1}</span>
                  </div>
                  <div className="dash-top-video-thumb">
                    <img
                      src={video.thumbnail?.url || video.thumbnail}
                      alt={video.title}
                    />
                    <div className="dash-top-video-duration">
                      {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : ''}
                    </div>
                  </div>
                  <div className="dash-top-video-info">
                    <p className="dash-top-video-title">{video.title}</p>
                    <div className="dash-top-video-stats">
                      <span><HiOutlineEye /> {formatNumber(video.views)} views</span>
                      {video.trendingScore > 0 && (
                        <span className="trending-badge">
                          <HiOutlineTrendingUp /> {video.trendingScore}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="dash-chart-empty">
              <HiOutlineVideoCamera />
              <p>No videos uploaded yet</p>
            </div>
          )}
        </motion.div>

        {/* Engagement Breakdown Pie */}
        <motion.div
          className="dash-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="dash-chart-header">
            <h3><HiOutlineTrendingUp /> Engagement Breakdown</h3>
          </div>
          <div className="dash-pie-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-pie-legend">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="dash-pie-legend-item">
                  <span
                    className="dash-pie-legend-dot"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="dash-pie-legend-label">{entry.name}</span>
                  <span className="dash-pie-legend-value">{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="dash-quick-stats">
            <div className="dash-quick-stat">
              <span className="dash-quick-label">Avg. Views / Video</span>
              <span className="dash-quick-value">{formatNumber(overview.avgViewsPerVideo)}</span>
            </div>
            <div className="dash-quick-stat">
              <span className="dash-quick-label">Total Videos</span>
              <span className="dash-quick-value">{overview.totalVideos}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
