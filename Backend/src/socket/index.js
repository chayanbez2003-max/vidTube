import { Server } from "socket.io";
import { Stream } from "../models/stream.model.js";

let io;

// Map of userId -> Set of socketIds (supports multiple tabs/devices)
const userSocketMap = new Map();

// Map of streamId -> Set of socketIds (viewers per stream)
const streamViewerMap = new Map();

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CROS_ORIGIN || "http://localhost:5173",
            credentials: true,
        },
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // User joins with their userId
        socket.on("join", (userId) => {
            if (!userId) return;
            
            socket.userId = userId;
            
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, new Set());
            }
            userSocketMap.get(userId).add(socket.id);
            
            // Join a personal room for targeted notifications
            socket.join(`user:${userId}`);
            
            console.log(`👤 User ${userId} joined (socket: ${socket.id})`);
        });

        // ==================== LIVE STREAM EVENTS ====================

        // Viewer joins a stream
        socket.on("stream:join", async (streamId) => {
            if (!streamId) return;

            socket.streamId = streamId;
            socket.join(`stream:${streamId}`);

            // Track viewer
            if (!streamViewerMap.has(streamId)) {
                streamViewerMap.set(streamId, new Set());
            }
            streamViewerMap.get(streamId).add(socket.id);

            const viewerCount = streamViewerMap.get(streamId).size;

            // Update DB viewer count
            try {
                await Stream.findByIdAndUpdate(streamId, {
                    viewers: viewerCount,
                    $max: { peakViewers: viewerCount },
                });
            } catch (e) { /* ignore */ }

            // Broadcast updated viewer count to everyone in the stream
            io.to(`stream:${streamId}`).emit("stream:viewers", viewerCount);

            console.log(`👁️ Viewer joined stream ${streamId} (${viewerCount} viewers)`);
        });

        // Viewer leaves a stream
        socket.on("stream:leave", async (streamId) => {
            if (!streamId) return;

            socket.leave(`stream:${streamId}`);

            const viewers = streamViewerMap.get(streamId);
            if (viewers) {
                viewers.delete(socket.id);
                if (viewers.size === 0) {
                    streamViewerMap.delete(streamId);
                }

                const viewerCount = viewers.size;

                try {
                    await Stream.findByIdAndUpdate(streamId, { viewers: viewerCount });
                } catch (e) { /* ignore */ }

                io.to(`stream:${streamId}`).emit("stream:viewers", viewerCount);
            }

            socket.streamId = null;
        });

        // Live chat message
        socket.on("stream:chat", (data) => {
            const { streamId, message, username, avatar, userId } = data;
            if (!streamId || !message) return;

            const chatMsg = {
                userId,
                username,
                avatar,
                message: message.substring(0, 300), // truncate
                timestamp: new Date().toISOString(),
            };

            // Broadcast to everyone in the stream room
            io.to(`stream:${streamId}`).emit("stream:chat:message", chatMsg);
        });

        // Streamer sends signal data (WebRTC)
        socket.on("stream:signal", (data) => {
            const { streamId, signal } = data;
            if (!streamId) return;
            socket.to(`stream:${streamId}`).emit("stream:signal", signal);
        });

        // Stream ended by streamer
        socket.on("stream:end", (streamId) => {
            if (!streamId) return;
            io.to(`stream:${streamId}`).emit("stream:ended");
            streamViewerMap.delete(streamId);
        });

        // ==================== DISCONNECT ====================

        // Handle disconnect
        socket.on("disconnect", async () => {
            // Remove from user map
            if (socket.userId) {
                const userSockets = userSocketMap.get(socket.userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    if (userSockets.size === 0) {
                        userSocketMap.delete(socket.userId);
                    }
                }
            }

            // Remove from stream viewer map
            if (socket.streamId) {
                const viewers = streamViewerMap.get(socket.streamId);
                if (viewers) {
                    viewers.delete(socket.id);
                    const viewerCount = viewers.size;
                    if (viewerCount === 0) {
                        streamViewerMap.delete(socket.streamId);
                    }

                    try {
                        await Stream.findByIdAndUpdate(socket.streamId, { viewers: viewerCount });
                    } catch (e) { /* ignore */ }

                    io.to(`stream:${socket.streamId}`).emit("stream:viewers", viewerCount);
                }
            }

            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Send a real-time notification to a specific user
 */
const sendRealtimeNotification = (userId, notification) => {
    if (!io) return;
    io.to(`user:${userId}`).emit("notification", notification);
};

/**
 * Broadcast to all connected users
 */
const broadcastEvent = (event, data) => {
    if (!io) return;
    io.emit(event, data);
};

/**
 * Check if a user is currently online
 */
const isUserOnline = (userId) => {
    return userSocketMap.has(userId) && userSocketMap.get(userId).size > 0;
};

/**
 * Get count of online users
 */
const getOnlineUsersCount = () => {
    return userSocketMap.size;
};

/**
 * Get the Socket.IO instance
 */
const getIO = () => io;

export { 
    initializeSocket, 
    sendRealtimeNotification, 
    broadcastEvent, 
    isUserOnline, 
    getOnlineUsersCount,
    getIO
};
