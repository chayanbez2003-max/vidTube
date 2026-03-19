import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

/**
 * Advanced search for videos
 * GET /api/v1/search?q=query&type=video|channel|tag&category=gaming&sortBy=relevance|date|views&page=1&limit=10
 */
const searchVideos = asyncHandler(async (req, res) => {
    const { 
        q, 
        type = "video", 
        category, 
        sortBy = "relevance", 
        page = 1, 
        limit = 12 
    } = req.query;

    if (!q || q.trim().length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { results: [], total: 0 }, "No search query provided")
        );
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchQuery = q.trim();

    if (type === "channel") {
        // Search for channels/users
        const channels = await User.aggregate([
            {
                $match: {
                    $or: [
                        { username: { $regex: searchQuery, $options: "i" } },
                        { fullName: { $regex: searchQuery, $options: "i" } },
                    ],
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "_id",
                    foreignField: "owner",
                    as: "videos",
                },
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                    videosCount: { $size: "$videos" },
                },
            },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    videosCount: 1,
                },
            },
            { $skip: skip },
            { $limit: parseInt(limit) },
        ]);

        const totalCount = await User.countDocuments({
            $or: [
                { username: { $regex: searchQuery, $options: "i" } },
                { fullName: { $regex: searchQuery, $options: "i" } },
            ],
        });

        return res.status(200).json(
            new ApiResponse(200, { results: channels, total: totalCount, type: "channel" }, "Channels fetched")
        );
    }

    // Default: Search for videos
    const pipeline = [];

    // Search match — supports fuzzy matching via regex
    const searchWords = searchQuery.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = searchWords.join("|");

    // Find owner IDs whose username or fullName matches the query
    // so that searching a creator's name surfaces their videos
    const matchingOwners = await User.find({
        $or: [
            { username: { $regex: regexPattern, $options: "i" } },
            { fullName: { $regex: regexPattern, $options: "i" } },
        ]
    }).select("_id").lean();
    const matchingOwnerIds = matchingOwners.map(u => u._id);

    const matchOrClauses = [
        { title: { $regex: regexPattern, $options: "i" } },
        { description: { $regex: regexPattern, $options: "i" } },
        { tags: { $in: searchWords.map(w => new RegExp(w, "i")) } },
    ];
    if (matchingOwnerIds.length > 0) {
        matchOrClauses.push({ owner: { $in: matchingOwnerIds } });
    }

    pipeline.push({
        $match: {
            isPublished: true,
            $or: matchOrClauses,
        },
    });

    // Category filter
    if (category && category !== "all") {
        pipeline.push({
            $match: { category },
        });
    }

    // Tag-specific search
    if (type === "tag") {
        pipeline.length = 0; // Reset pipeline
        pipeline.push({
            $match: {
                isPublished: true,
                tags: { $in: [new RegExp(searchQuery, "i")] },
            },
        });
    }

    // Sorting
    const sortOptions = {
        relevance: { score: { $meta: "textScore" } },
        date: { createdAt: -1 },
        views: { views: -1 },
        trending: { trendingScore: -1 },
    };

    // For relevance sorting, try text search first
    if (sortBy === "relevance") {
        pipeline.push({ $sort: { views: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: sortOptions[sortBy] || { createdAt: -1 } });
    }

    // Lookup owner details
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$ownerDetails" }
    );

    // Project
    pipeline.push({
        $project: {
            title: 1,
            description: 1,
            "thumbnail.url": 1,
            "videoFile.url": 1,
            views: 1,
            duration: 1,
            createdAt: 1,
            tags: 1,
            category: 1,
            trendingScore: 1,
            ownerDetails: 1,
        },
    });

    // Get total count before pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    const countResult = await Video.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const results = await Video.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                results,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                type: type === "tag" ? "tag" : "video",
            },
            "Search results fetched"
        )
    );
});

/**
 * Get search suggestions / autocomplete
 * GET /api/v1/search/suggestions?q=query
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(200).json(
            new ApiResponse(200, [], "No suggestions")
        );
    }

    const searchQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Get video title suggestions
    const videoSuggestions = await Video.find(
        {
            isPublished: true,
            title: { $regex: searchQuery, $options: "i" },
        },
        { title: 1 }
    )
        .limit(5)
        .lean();

    // Get tag suggestions
    const tagSuggestions = await Video.distinct("tags", {
        isPublished: true,
        tags: { $regex: searchQuery, $options: "i" },
    });

    // Get channel suggestions
    const channelSuggestions = await User.find(
        {
            $or: [
                { username: { $regex: searchQuery, $options: "i" } },
                { fullName: { $regex: searchQuery, $options: "i" } },
            ],
        },
        { username: 1, fullName: 1, avatar: 1 }
    )
        .limit(3)
        .lean();

    const suggestions = {
        videos: videoSuggestions.map(v => v.title),
        tags: tagSuggestions.slice(0, 5),
        channels: channelSuggestions,
    };

    return res.status(200).json(
        new ApiResponse(200, suggestions, "Search suggestions fetched")
    );
});

/**
 * Get trending search keywords
 * GET /api/v1/search/trending
 */
const getTrendingSearches = asyncHandler(async (req, res) => {
    // Get most popular tags from recent videos
    const trendingTags = await Video.aggregate([
        { $match: { isPublished: true } },
        { $sort: { trendingScore: -1 } },
        { $limit: 100 },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { keyword: "$_id", count: 1, _id: 0 } },
    ]);

    return res.status(200).json(
        new ApiResponse(200, trendingTags, "Trending searches fetched")
    );
});

export { searchVideos, getSearchSuggestions, getTrendingSearches };
