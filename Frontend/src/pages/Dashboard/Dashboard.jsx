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
      <div className="bg-bg-elevated/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <p className="text-white/60 text-xs font-semibold mb-2 m-0 uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[13.5px] m-0 mb-1 last:mb-0" style={{ color: entry.color }}>
            {entry.name}: <strong className="font-bold text-white ml-1">{formatNumber(entry.value)}</strong>
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
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-white/10 border-t-teal-primary rounded-full animate-spin mb-4" />
          <p className="text-white/50 font-medium">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="text-[48px] text-white/20 mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No analytics available</h3>
          <p className="text-white/50 text-sm">Start uploading videos to see your channel analytics.</p>
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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <motion.h1
            className="flex items-center gap-2 text-2xl md:text-3xl font-light mb-1 m-0 text-white/90"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HiOutlineChartBar className="text-teal-primary text-[26px] md:text-[32px]" />
            Creator <span className="text-teal-gradient">Dashboard</span>
          </motion.h1>
          <p className="text-white/60 text-[14.5px] m-0 mt-1">
            Welcome back, <strong>{user?.fullName || user?.username}</strong> — here's how your channel is performing.
          </p>
        </div>
        <motion.button
          className="btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm border-white/10"
          onClick={handleRefresh}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={refreshing}
        >
          <HiOutlineRefresh className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="relative overflow-hidden p-6 rounded-2xl border bg-bg-surface flex items-center gap-5 transition-all"
            style={{
              background: stat.gradient,
              borderColor: stat.border,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -4, boxShadow: `0 12px 30px ${stat.border}` }}
          >
            <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[26px] shrink-0" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div className="flex flex-col">
              <p className="text-[13.5px] text-white/60 font-medium mb-1">{stat.label}</p>
              <h2 className="text-2xl font-bold m-0 tracking-tight" style={{ color: stat.color }}>{stat.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscriber Growth Chart */}
        <motion.div
          className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white/90 flex items-center gap-2 m-0"><HiOutlineUserGroup className="text-teal-soft text-[18px]" /> Subscriber Growth</h3>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">Last 30 days</span>
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
            <div className="h-[280px] flex flex-col items-center justify-center text-white/30 gap-3">
              <HiOutlineUserGroup className="text-4xl" />
              <p>No subscriber data yet</p>
            </div>
          )}
        </motion.div>

        {/* Views Over Time Chart */}
        <motion.div
          className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white/90 flex items-center gap-2 m-0"><HiOutlineEye className="text-teal-primary text-[18px]" /> Views Over Time</h3>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">Last 30 days</span>
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
            <div className="h-[280px] flex flex-col items-center justify-center text-white/30 gap-3">
              <HiOutlineEye className="text-4xl" />
              <p>No view data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Top Videos + Engagement Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Videos */}
        <motion.div
          className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white/90 flex items-center gap-2 m-0"><HiOutlineVideoCamera className="text-teal-primary text-[18px]" /> Top Performing Videos</h3>
          </div>
          {topVideos && topVideos.length > 0 ? (
            <div className="flex flex-col gap-4">
              {topVideos.map((video, index) => (
                <motion.div
                  key={video._id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.08 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-6 flex-shrink-0 text-center font-bold text-sm text-white/40 group-hover:text-white/80 transition-colors">
                    <span>#{index + 1}</span>
                  </div>
                  <div className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={video.thumbnail?.url || video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
                      {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate m-0 group-hover:text-teal-soft transition-colors">{video.title}</p>
                    <div className="flex items-center gap-3 text-[12px] text-white/50 m-0">
                      <span><HiOutlineEye /> {formatNumber(video.views)} views</span>
                      {video.trendingScore > 0 && (
                        <span className="flex items-center gap-1 text-teal-primary bg-teal-primary/10 px-1.5 py-0.5 rounded border border-teal-primary/20">
                          <HiOutlineTrendingUp /> {video.trendingScore}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-white/30 gap-3">
              <HiOutlineVideoCamera className="text-4xl" />
              <p>No videos uploaded yet</p>
            </div>
          )}
        </motion.div>

        {/* Engagement Breakdown Pie */}
        <motion.div
          className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white/90 flex items-center gap-2 m-0"><HiOutlineTrendingUp className="text-teal-soft text-[18px]" /> Engagement Breakdown</h3>
          </div>
          <div className="flex flex-col items-center">
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
            <div className="w-full grid grid-cols-2 gap-3 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-[13px] text-white/60 font-medium flex-1">{entry.name}</span>
                  <span className="text-[13px] text-white/90 font-bold m-0">{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/10">
            <div className="flex-1 bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1 text-center">
              <span className="text-[12px] text-white/50 font-medium uppercase tracking-wider">Avg. Views / Video</span>
              <span className="text-[22px] font-bold text-white/90">{formatNumber(overview.avgViewsPerVideo)}</span>
            </div>
            <div className="flex-1 bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1 text-center">
              <span className="text-[12px] text-white/50 font-medium uppercase tracking-wider">Total Videos</span>
              <span className="text-[22px] font-bold text-white/90">{overview.totalVideos}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
