import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many authentication attempts, please try again later." },
});
app.use(
    cors({
    origin: process.env.CROS_ORIGIN,
    credentials: true
    })
);

app.use(express.json({limit:"17kb"}));
app.use(express.urlencoded({extended:true, limit:"17kb"}));
app.use((express.static('public')));
app.use(cookieParser());

// Import routes

import userRoutes from './routes/user.routes.js';
import health from "./routes/healthCheck.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import tweetRoutes from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import searchRouter from "./routes/search.routes.js";
import watchProgressRouter from "./routes/watchProgress.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import streamRouter from "./routes/stream.routes.js";

//route declaration 
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/health", health);
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/tweets",tweetRoutes)
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);

// New routes
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/watch-progress", watchProgressRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/streams", streamRouter);
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

 export {app }