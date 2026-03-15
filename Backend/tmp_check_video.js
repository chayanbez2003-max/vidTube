import connectDB from "./src/db/index.js";
import { Video } from "./src/models/video.model.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB()
  .then(async () => {
    const lastVideo = await Video.findOne({ title: /testing/i }).sort({ createdAt: -1 });
    console.log("Video ID:", lastVideo._id);
    console.log("Video URL:", lastVideo.videoFile?.url);
    console.log("Duration:", lastVideo.duration);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
