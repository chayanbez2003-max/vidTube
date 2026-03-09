import mongoose, { Schema } from "mongoose";

const streamSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    streamer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    streamKey: {
        type: String,
        required: true,
        unique: true,
    },
    isLive: {
        type: Boolean,
        default: false,
    },
    viewers: {
        type: Number,
        default: 0,
    },
    peakViewers: {
        type: Number,
        default: 0,
    },
    thumbnail: {
        type: String,
        default: "",
    },
    category: {
        type: String,
        enum: [
            'education', 'entertainment', 'gaming', 'music',
            'news', 'sports', 'technology', 'travel',
            'comedy', 'howto', 'science', 'other'
        ],
        default: 'other',
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    chatMessages: [{
        user: { type: Schema.Types.ObjectId, ref: "User" },
        username: String,
        avatar: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
    }],
    startedAt: {
        type: Date,
    },
    endedAt: {
        type: Date,
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
}, { timestamps: true });

streamSchema.index({ isLive: 1, createdAt: -1 });
streamSchema.index({ streamer: 1 });

export const Stream = mongoose.model("Stream", streamSchema);
