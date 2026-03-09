import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { WatchProgress } from "../models/watchProgress.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get detailed analytics for a creator's channel
 * GET /api/v1/analytics/channel
 */
const getChannelAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Total subscribers
    const subscriberStats = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: 1 } } },
    ]);

    // Subscriber growth — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const subscriberGrowth = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: thirtyDaysAgo },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // Video stats
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            },
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalWatchTime: { $sum: "$totalWatchTime" },
                totalLikes: { $sum: { $size: "$likes" } },
                totalComments: { $sum: { $size: "$comments" } },
                avgViews: { $avg: "$views" },
            },
        },
    ]);

    // Top performing videos
    const topVideos = await Video.find({ owner: userId, isPublished: true })
        .sort({ views: -1 })
        .limit(5)
        .select("title thumbnail views trendingScore createdAt duration");

    // Views over last 30 days (approximate using video createdAt)
    const viewsOverTime = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: thirtyDaysAgo },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                views: { $sum: "$views" },
                uploads: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", views: 1, uploads: 1, _id: 0 } },
    ]);

    // Engagement rate = (likes + comments) / views * 100
    const stats = videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalWatchTime: 0,
        totalLikes: 0,
        totalComments: 0,
        avgViews: 0,
    };

    const engagementRate =
        stats.totalViews > 0
            ? (((stats.totalLikes + stats.totalComments) / stats.totalViews) * 100).toFixed(2)
            : 0;

    // Format watch time
    const watchTimeHours = Math.round((stats.totalWatchTime || 0) / 3600);

    const analytics = {
        overview: {
            totalSubscribers: subscriberStats[0]?.total || 0,
            totalVideos: stats.totalVideos,
            totalViews: stats.totalViews,
            totalLikes: stats.totalLikes,
            totalComments: stats.totalComments,
            totalWatchTimeHours: watchTimeHours,
            engagementRate: parseFloat(engagementRate),
            avgViewsPerVideo: Math.round(stats.avgViews || 0),
        },
        subscriberGrowth,
        viewsOverTime,
        topVideos,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, analytics, "Channel analytics fetched successfully"));
});

/**
 * Get analytics for a specific video
 * GET /api/v1/analytics/video/:videoId
 */
const getVideoAnalytics = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({
        _id: videoId,
        owner: userId,
    });

    if (!video) {
        return res.status(404).json(new ApiResponse(404, null, "Video not found or unauthorized"));
    }

    // Likes count
    const likesCount = await Like.countDocuments({ video: videoId });

    // Comments count
    const commentsCount = await Comment.countDocuments({ video: videoId });

    // Average watch percentage
    const watchStats = await WatchProgress.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $group: {
                _id: null,
                avgPercentage: { $avg: "$percentage" },
                totalWatchers: { $sum: 1 },
                completions: {
                    $sum: { $cond: ["$completed", 1, 0] },
                },
            },
        },
    ]);

    const analytics = {
        video: {
            _id: video._id,
            title: video.title,
            thumbnail: video.thumbnail,
            views: video.views,
            duration: video.duration,
            createdAt: video.createdAt,
            tags: video.tags,
            category: video.category,
            trendingScore: video.trendingScore,
        },
        engagement: {
            likes: likesCount,
            comments: commentsCount,
            engagementRate:
                video.views > 0
                    ? (((likesCount + commentsCount) / video.views) * 100).toFixed(2)
                    : 0,
        },
        watchMetrics: {
            avgWatchPercentage: Math.round(watchStats[0]?.avgPercentage || 0),
            totalWatchers: watchStats[0]?.totalWatchers || 0,
            completions: watchStats[0]?.completions || 0,
            completionRate:
                watchStats[0]?.totalWatchers > 0
                    ? ((watchStats[0].completions / watchStats[0].totalWatchers) * 100).toFixed(1)
                    : 0,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, analytics, "Video analytics fetched"));
});

export { getChannelAnalytics, getVideoAnalytics };
