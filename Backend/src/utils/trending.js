import { Video } from "../models/video.model.js";

/**
 * Calculate trending score for a video
 * Formula: views * 0.4 + likes * 0.3 + comments * 0.2 + watchTime * 0.1
 * Includes time decay — newer videos get a boost
 */
const calculateTrendingScore = (views = 0, likes = 0, comments = 0, watchTime = 0, createdAt = new Date()) => {
    const baseScore = 
        (views * 0.4) + 
        (likes * 0.3) + 
        (comments * 0.2) + 
        (watchTime * 0.1);

    // Time decay factor — videos lose relevance over time
    const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const timeFactor = Math.max(1, Math.pow(1 + ageInHours / 24, 1.5)); // decay over days

    return Math.round((baseScore / timeFactor) * 100) / 100;
};

/**
 * Update trending scores for all videos (run periodically via cron or manual trigger)
 */
const updateAllTrendingScores = async () => {
    try {
        const videos = await Video.aggregate([
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments"
                }
            },
            {
                $project: {
                    views: 1,
                    totalWatchTime: 1,
                    createdAt: 1,
                    likesCount: { $size: "$likes" },
                    commentsCount: { $size: "$comments" }
                }
            }
        ]);

        const bulkOps = videos.map(video => ({
            updateOne: {
                filter: { _id: video._id },
                update: {
                    $set: {
                        trendingScore: calculateTrendingScore(
                            video.views,
                            video.likesCount,
                            video.commentsCount,
                            video.totalWatchTime,
                            video.createdAt
                        )
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await Video.bulkWrite(bulkOps);
            console.log(`✅ Updated trending scores for ${bulkOps.length} videos`);
        }

        return bulkOps.length;
    } catch (error) {
        console.error("❌ Error updating trending scores:", error.message);
        throw error;
    }
};

/**
 * Get trending videos
 * @param {number} limit - Number of trending videos to return
 */
const getTrendingVideos = async (limit = 20) => {
    return await Video.find({ isPublished: true })
        .sort({ trendingScore: -1 })
        .limit(limit)
        .populate("owner", "username avatar fullName");
};

export { calculateTrendingScore, updateAllTrendingScores, getTrendingVideos };
