import mongoose, { Schema } from "mongoose";

const watchProgressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    watchedDuration: {
        type: Number, // In seconds — how far the user watched
        default: 0,
    },
    totalDuration: {
        type: Number, // Total video duration in seconds
        default: 0,
    },
    percentage: {
        type: Number, // 0-100 percent watched
        default: 0,
    },
    completed: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Compound index: one progress record per user per video
watchProgressSchema.index({ user: 1, video: 1 }, { unique: true });

export const WatchProgress = mongoose.model("WatchProgress", watchProgressSchema);
