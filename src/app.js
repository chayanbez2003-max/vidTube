import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express();
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
 export {app }