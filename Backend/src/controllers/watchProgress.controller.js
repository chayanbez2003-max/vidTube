import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { WatchProgress } from "../models/watchProgress.model.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";

/**
 * Save or update watch progress for a video
 * POST /api/v1/watch-progress/:videoId
 * Body: { watchedDuration, totalDuration }
 */
const updateWatchProgress = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { watchedDuration, totalDuration } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (watchedDuration === undefined || totalDuration === undefined) {
        throw new ApiError(400, "watchedDuration and totalDuration are required");
    }

    const percentage = totalDuration > 0 
        ? Math.min(100, Math.round((watchedDuration / totalDuration) * 100)) 
        : 0;

    const completed = percentage >= 95; // Mark complete if watched 95% or more

    const progress = await WatchProgress.findOneAndUpdate(
        { user: req.user._id, video: videoId },
        {
            watchedDuration,
            totalDuration,
            percentage,
            completed,
        },
        { upsert: true, new: true }
    );

    // Also update total watch time on the video model
    await Video.findByIdAndUpdate(videoId, {
        $inc: { totalWatchTime: Math.max(0, watchedDuration) }
    });

    return res.status(200).json(
        new ApiResponse(200, progress, "Watch progress updated")
    );
});

/**
 * Get watch progress for a specific video
 * GET /api/v1/watch-progress/:videoId
 */
const getWatchProgress = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const progress = await WatchProgress.findOne({
        user: req.user._id,
        video: videoId,
    });

    return res.status(200).json(
        new ApiResponse(200, progress || { watchedDuration: 0, percentage: 0 }, "Watch progress fetched")
    );
});

/**
 * Get all in-progress (not completed) videos for the user
 * GET /api/v1/watch-progress/continue-watching
 */
const getContinueWatching = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const progressList = await WatchProgress.find({
        user: req.user._id,
        completed: false,
        percentage: { $gt: 5 }, // At least 5% watched
    })
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .populate({
            path: "video",
            select: "title thumbnail duration views owner",
            populate: {
                path: "owner",
                select: "username avatar fullName",
            },
        });

    // Filter out null videos (deleted videos)
    const filtered = progressList.filter(p => p.video !== null);

    return res.status(200).json(
        new ApiResponse(200, filtered, "Continue watching list fetched")
    );
});

export { updateWatchProgress, getWatchProgress, getContinueWatching };
