import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["like", "comment", "subscribe", "upload"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        // Reference to the related entity
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: null,
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
