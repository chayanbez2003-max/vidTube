import mongoose, { isValidObjectId } from "mongoose";
import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all notifications for the logged-in user
const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.aggregate([
        {
            $match: {
                recipient: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: skip,
        },
        {
            $limit: parseInt(limit),
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            "avatar.url": 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            "thumbnail.url": 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                sender: { $first: "$sender" },
                video: { $first: "$video" },
            },
        },
    ]);

    const totalCount = await Notification.countDocuments({
        recipient: req.user._id,
    });

    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                totalCount,
                unreadCount,
                page: parseInt(page),
                hasMore: skip + notifications.length < totalCount,
            },
            "Notifications fetched successfully"
        )
    );
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { unreadCount }, "Unread count fetched successfully")
        );
});

// Mark a single notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!isValidObjectId(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

// Delete a single notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!isValidObjectId(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: req.user._id,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

// Clear all notifications
const clearAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipient: req.user._id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications cleared"));
});

// ==================== HELPER: Create Notification ====================
// This is NOT a route handler — it's a utility function used by other controllers

const createNotification = async ({ recipient, sender, type, message, video = null, comment = null }) => {
    try {
        // Don't notify yourself
        if (String(recipient) === String(sender)) return null;

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            message,
            video,
            comment,
        });

        return notification;
    } catch (error) {
        // Silently fail — notifications should never break main operations
        console.error("Failed to create notification:", error.message);
        return null;
    }
};

export {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
};
