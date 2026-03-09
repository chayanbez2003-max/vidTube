import dotenv from "dotenv";
import { createServer } from "http";
import connectToDatabase from "./db/index.js";
import { app } from "./app.js";
import { initializeSocket } from "./socket/index.js";
import { updateAllTrendingScores } from "./utils/trending.js";

dotenv.config({
    path: "./.env"
});

// Create HTTP server and attach Socket.IO
const server = createServer(app);
const io = initializeSocket(server);

connectToDatabase()

.then(()=>{
    server.listen(process.env.PORT||8000 , () => {
        console.log(`🚀 Server is running on port: ${process.env.PORT}`);
        console.log(`⚡ Socket.IO is ready for real-time connections`);
    });

    // Refresh trending scores every hour
    setInterval(async () => {
        try {
            await updateAllTrendingScores();
            console.log("📊 Trending scores refreshed automatically");
        } catch (err) {
            console.error("Failed to refresh trending scores:", err.message);
        }
    }, 60 * 60 * 1000); // Every 1 hour
})
.catch((err) => {
    console.error("Failed to connect to the database:", err);}
)
