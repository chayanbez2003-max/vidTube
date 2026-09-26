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
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl">
        <p className="text-slate-400 text-[11px] font-bold mb-1.5 uppercase tracking-wider">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[13px] font-medium m-0 mb-0.5 last:mb-0" style={{ color: entry.color }}>
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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="text-[48px] text-slate-300 mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2 text-slate-900">No analytics available</h3>
          <p className="text-slate-500 text-sm">Start uploading videos to see your channel analytics.</p>
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
      color: '#0284c7',
      gradient: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.06))',
      border: 'rgba(14,165,233,0.3)',
      iconBg: 'bg-sky-500 text-white',
    },
    {
      label: 'Subscribers',
      value: formatNumber(overview.totalSubscribers),
      icon: <HiOutlineUserGroup />,
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.06))',
      border: 'rgba(124,58,237,0.3)',
      iconBg: 'bg-violet-600 text-white',
    },
    {
      label: 'Watch Time',
      value: formatWatchTime(overview.totalWatchTimeHours),
      icon: <HiOutlineClock />,
      color: '#059669',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
      border: 'rgba(16,185,129,0.3)',
      iconBg: 'bg-emerald-500 text-white',
    },
    {
      label: 'Total Likes',
      value: formatNumber(overview.totalLikes),
      icon: <HiOutlineThumbUp />,
      color: '#db2777',
      gradient: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(219,39,119,0.06))',
      border: 'rgba(236,72,153,0.3)',
      iconBg: 'bg-pink-500 text-white',
    },
    {
      label: 'Comments',
      value: formatNumber(overview.totalComments),
      icon: <HiOutlineChatAlt2 />,
      color: '#ea580c',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.06))',
      border: 'rgba(249,115,22,0.3)',
      iconBg: 'bg-orange-500 text-white',
    },
    {
      label: 'Engagement Rate',
      value: overview.engagementRate + '%',
      icon: <HiOutlineTrendingUp />,
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06))',
      border: 'rgba(59,130,246,0.3)',
      iconBg: 'bg-blue-600 text-white',
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
            className="flex items-center gap-3 text-2xl md:text-3xl font-bold mb-1 m-0 text-slate-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-sky-500/20">
              <HiOutlineChartBar />
            </div>
            <span>Creator <span className="bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 text-transparent bg-clip-text">Dashboard</span></span>
          </motion.h1>
          <p className="text-slate-500 text-sm m-0 mt-1 ml-0 sm:ml-13">
            Welcome back, <strong>{user?.fullName || user?.username}</strong> — here's how your channel is performing.
          </p>
        </div>
        <motion.button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer"
          onClick={handleRefresh}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={refreshing}
        >
          <HiOutlineRefresh className={`text-base text-sky-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="relative overflow-hidden p-5 md:p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md flex items-center gap-4.5 transition-all"
            style={{
              borderColor: stat.border,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
              <h2 className="text-2xl md:text-3xl font-bold m-0 tracking-tight text-slate-900">{stat.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscriber Growth Chart */}
        <motion.div
          className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <HiOutlineUserGroup className="text-sky-500 text-lg" /> Subscriber Growth
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Last 30 days</span>
          </div>
          {subscriberGrowth && subscriberGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={subscriberGrowth}>
                <defs>
                  <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => val?.slice(5) || val}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="New Subscribers"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#subGradient)"
                  dot={{ fill: '#0ea5e9', r: 3 }}
                  activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 gap-3">
              <HiOutlineUserGroup className="text-4xl text-slate-300" />
              <p className="font-medium text-sm">No subscriber data recorded yet</p>
            </div>
          )}
        </motion.div>

        {/* Views Over Time Chart */}
        <motion.div
          className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <HiOutlineEye className="text-violet-600 text-lg" /> Views Over Time
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Last 30 days</span>
          </div>
          {viewsOverTime && viewsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={viewsOverTime}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => val?.slice(5) || val}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
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
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 gap-3">
              <HiOutlineEye className="text-4xl text-slate-300" />
              <p className="font-medium text-sm">No view data recorded yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Top Videos + Engagement Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Videos */}
        <motion.div
          className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <HiOutlineVideoCamera className="text-sky-500 text-lg" /> Top Performing Videos
            </h3>
          </div>
          {topVideos && topVideos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {topVideos.map((video, index) => (
                <motion.div
                  key={video._id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all group cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ x: 3 }}
                >
                  <div className="w-6 flex-shrink-0 text-center font-bold text-xs text-slate-400 group-hover:text-sky-600 transition-colors">
                    <span>#{index + 1}</span>
                  </div>
                  <div className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={video.thumbnail?.url || video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/75 text-white px-1.5 py-[1px] rounded text-[10px] font-semibold tracking-[0.3px] backdrop-blur-sm">
                      {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate m-0 group-hover:text-sky-600 transition-colors">{video.title}</p>
                    <div className="flex items-center gap-3 text-[12px] text-slate-500 m-0">
                      <span><HiOutlineEye className="inline mr-1" />{formatNumber(video.views)} views</span>
                      {video.trendingScore > 0 && (
                        <span className="flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 font-semibold text-[11px]">
                          <HiOutlineTrendingUp /> {video.trendingScore}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 gap-3">
              <HiOutlineVideoCamera className="text-4xl text-slate-300" />
              <p className="font-medium text-sm">No videos uploaded yet</p>
            </div>
          )}
        </motion.div>

        {/* Engagement Breakdown Pie */}
        <motion.div
          className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <HiOutlineTrendingUp className="text-indigo-600 text-lg" /> Engagement Breakdown
            </h3>
          </div>
          <div className="flex flex-col items-center flex-1">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
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
            <div className="w-full grid grid-cols-2 gap-3 mt-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-slate-600 font-medium flex-1">{entry.name}</span>
                  <span className="text-xs text-slate-900 font-bold m-0">{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-slate-100">
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1 text-center">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Avg. Views / Video</span>
              <span className="text-2xl font-bold text-slate-900">{formatNumber(overview.avgViewsPerVideo)}</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1 text-center">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Videos</span>
              <span className="text-2xl font-bold text-slate-900">{overview.totalVideos}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
