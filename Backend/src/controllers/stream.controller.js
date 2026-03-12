import crypto from "crypto";
import mongoose from "mongoose";
import { Stream } from "../models/stream.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendRealtimeNotification } from "../socket/index.js";
import { createNotification } from "./notification.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const startStream = asyncHandler(async (req, res) => {
    const { title, description, category, tags } = req.body;

    if (!title || !title.trim()) {
        throw new ApiError(400, "Stream title is required");
    }

    // Check if user already has an active stream
    const existingStream = await Stream.findOne({
        streamer: req.user._id,
        isLive: true,
    });

    if (existingStream) {
        throw new ApiError(400, "You already have an active stream. End it before starting a new one.");
    }

    // Generate unique stream key
    const streamKey = crypto.randomBytes(16).toString("hex");

    // Parse tags
    let parsedTags = [];
    if (tags) {
        parsedTags = Array.isArray(tags)
            ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
            : tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const thumbUrl = req.user.avatar?.url || req.user.avatar || "";

    // Create a Video record immediately so existing like/comment APIs work
    const videoData = {
        title: title.trim(),
        description: description || `Live stream by ${req.user.username}`,
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1615461158/sample_video.mp4",
            public_id: "stream_placeholder"
        },
        duration: 0,
        owner: req.user._id,
        isPublished: true,
        category: category || "other",
        tags: parsedTags,
    };

    // Only add thumbnail if available
    if (thumbUrl) {
        videoData.thumbnail = { url: thumbUrl, public_id: "stream_thumb" };
    }

    const video = await Video.create(videoData);

    const stream = await Stream.create({
        title: title.trim(),
        description: description || "",
        streamer: req.user._id,
        streamKey,
        isLive: true,
        startedAt: new Date(),
        category: category || "other",
        tags: parsedTags,
        thumbnail: thumbUrl,
        videoId: video._id,
    });

    // Populate streamer details
    await stream.populate("streamer", "username fullName avatar");

    // Notify subscribers that the user is live
    const subscribers = await Subscription.find({ channel: req.user._id }).select("subscriber");
    for (const sub of subscribers) {
        createNotification({
            recipient: sub.subscriber,
            sender: req.user._id,
            type: "upload",
            message: `🔴 ${req.user.username} is now LIVE: "${title}"`,
        });
    }

    return res.status(201).json(
        new ApiResponse(201, stream, "Stream started successfully")
    );
});

/**
 * End a live stream
 * POST /api/v1/streams/end/:streamId
 */
const endStream = asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    console.log(`[endStream] Attempting to end stream: ${streamId} by user: ${req.user?._id}`);

    const stream = await Stream.findOne({
        _id: streamId,
        streamer: req.user._id,
        isLive: true,
    });

    if (!stream) {
        console.log(`[endStream] No active stream found with ID: ${streamId} for user: ${req.user?._id}`);
        throw new ApiError(404, "Active stream not found");
    }

    stream.isLive = false;
    stream.endedAt = new Date();
    await stream.save();

    // Send the response immediately to prevent HTTP timeouts
    res.status(200).json(
        new ApiResponse(200, stream, "Stream ended successfully. Video is processing in the background.")
    );

    // Process the video upload in the background
    const videoFileLocalPath = req.file?.path;
    
    if (videoFileLocalPath) {
        (async () => {
            let uploadedVideoParams = {};
            let uploadSuccess = false;
            try {
                console.log("[endStream] Uploading recorded stream to Cloudinary...");
                const videoNode = await uploadOnCloudinary(videoFileLocalPath);
                if (videoNode) {
                    uploadedVideoParams.videoFile = {
                        url: videoNode.url,
                        public_id: videoNode.public_id
                    };
                    uploadSuccess = true;
                    console.log("[endStream] Cloudinary upload successful:", videoNode.url);
                } else {
                    console.error("[endStream] Cloudinary upload returned null — file may be too large or invalid.");
                }
            } catch (error) {
                console.error("[endStream] Failed to upload recorded stream:", error);
            }

            // Update the linked video with final data
            if (stream.videoId) {
                try {
                    const durationSec = Math.floor((stream.endedAt - stream.startedAt) / 1000) || 0;
                    const updatePayload = {
                        duration: durationSec,
                        views: stream.peakViewers || 0,
                        description: stream.description || `Live stream \u2014 Duration: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
                        // Only keep video published if upload actually succeeded
                        isPublished: uploadSuccess,
                        ...uploadedVideoParams
                    };
                    await Video.findByIdAndUpdate(stream.videoId, updatePayload);
                    console.log(`[endStream] Video record updated. Published: ${uploadSuccess}`);
                } catch (error) {
                    console.error("[endStream] Failed to update video record:", error);
                }
            }
        })();
    } else if (stream.videoId) {
        // If there was no file uploaded, just update the duration and views without the video file
        try {
            const durationSec = Math.floor((stream.endedAt - stream.startedAt) / 1000) || 0;
            const updatePayload = {
                duration: durationSec,
                views: stream.peakViewers || 0,
                description: stream.description || `Live stream \u2014 Duration: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
            };
            await Video.findByIdAndUpdate(stream.videoId, updatePayload);
        } catch (error) {
            console.error("Failed to update video record duration:", error);
        }
    }
});

/**
 * Get all currently live streams
 * GET /api/v1/streams/live
 */
const getLiveStreams = asyncHandler(async (req, res) => {
    const { category, page = 1, limit = 12 } = req.query;

    const filter = { isLive: true };
    if (category && category !== "all") {
        filter.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const streams = await Stream.find(filter)
        .populate("streamer", "username fullName avatar")
        .sort({ viewers: -1, startedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Stream.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            streams,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        }, "Live streams fetched")
    );
});

/**
 * Get a single stream by ID
 * GET /api/v1/streams/:streamId
 */
const getStreamById = asyncHandler(async (req, res) => {
    const { streamId } = req.params;

    if (!mongoose.isValidObjectId(streamId)) {
        throw new ApiError(400, "Invalid stream ID");
    }

    const stream = await Stream.findById(streamId)
        .populate("streamer", "username fullName avatar");

    if (!stream) {
        throw new ApiError(404, "Stream not found");
    }

    return res.status(200).json(
        new ApiResponse(200, stream, "Stream fetched")
    );
});
const getMyStream = asyncHandler(async (req, res) => {
    const stream = await Stream.findOne({
        streamer: req.user._id,
    })
        .sort({ createdAt: -1 })
        .populate("streamer", "username fullName avatar");

    return res.status(200).json(
        new ApiResponse(200, stream, "My stream fetched")
    );
});

/**
 * Send a chat message in a stream
 * POST /api/v1/streams/:streamId/chat
 */
const sendChatMessage = asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
        throw new ApiError(400, "Message cannot be empty");
    }

    if (message.length > 300) {
        throw new ApiError(400, "Message is too long (max 300 characters)");
    }

    const stream = await Stream.findOne({ _id: streamId, isLive: true });

    if (!stream) {
        throw new ApiError(404, "Stream not found or not live");
    }

    const chatMsg = {
        user: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar?.url || req.user.avatar || "",
        message: message.trim(),
        timestamp: new Date(),
    };

    // Save to DB (keep last 200 messages)
    stream.chatMessages.push(chatMsg);
    if (stream.chatMessages.length > 200) {
        stream.chatMessages = stream.chatMessages.slice(-200);
    }
    await stream.save();

    return res.status(201).json(
        new ApiResponse(201, chatMsg, "Message sent")
    );
});

/**
 * Get past streams (ended streams)
 * GET /api/v1/streams/past
 */
const getPastStreams = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const streams = await Stream.find({ isLive: false })
        .populate("streamer", "username fullName avatar")
        .sort({ endedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Stream.countDocuments({ isLive: false });

    return res.status(200).json(
        new ApiResponse(200, {
            streams,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        }, "Past streams fetched")
    );
});

export {
    startStream,
    endStream,
    getLiveStreams,
    getStreamById,
    getMyStream,
    sendChatMessage,
    getPastStreams,
};
