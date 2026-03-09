import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs";

// Set FFmpeg path from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Compress video to a specified resolution
 * @param {string} inputPath - Path to the input video file
 * @param {string} outputDir - Directory to save output
 * @param {string} resolution - Resolution label (e.g., '720p', '480p', '360p')
 * @returns {Promise<string>} - Path to the compressed video
 */
const compressVideo = (inputPath, outputDir, resolution = "720p") => {
    return new Promise((resolve, reject) => {
        const resolutionMap = {
            "360p": { size: "640x360", bitrate: "400k" },
            "480p": { size: "854x480", bitrate: "800k" },
            "720p": { size: "1280x720", bitrate: "1500k" },
            "1080p": { size: "1920x1080", bitrate: "3000k" },
        };

        const config = resolutionMap[resolution] || resolutionMap["720p"];
        const outputFileName = `compressed_${resolution}_${Date.now()}.mp4`;
        const outputPath = path.join(outputDir, outputFileName);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(inputPath)
            .outputOptions([
                `-vf scale=${config.size.split("x")[0]}:-2`,
                `-b:v ${config.bitrate}`,
                "-c:v libx264",
                "-preset fast",
                "-c:a aac",
                "-b:a 128k",
                "-movflags +faststart",
            ])
            .output(outputPath)
            .on("end", () => {
                console.log(`✅ Video compressed to ${resolution}: ${outputPath}`);
                resolve(outputPath);
            })
            .on("error", (err) => {
                console.error(`❌ Error compressing video to ${resolution}:`, err.message);
                reject(err);
            })
            .on("progress", (progress) => {
                if (progress.percent) {
                    console.log(`⏳ Compressing ${resolution}: ${Math.round(progress.percent)}%`);
                }
            })
            .run();
    });
};

/**
 * Generate thumbnail from a video at a specific timestamp
 * @param {string} inputPath - Path to the input video
 * @param {string} outputDir - Directory to save thumbnails
 * @param {number} timestamp - Timestamp in seconds to capture thumbnail
 * @returns {Promise<string>} - Path to the generated thumbnail
 */
const generateThumbnail = (inputPath, outputDir, timestamp = 2) => {
    return new Promise((resolve, reject) => {
        const thumbnailName = `thumb_${Date.now()}.jpg`;
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(inputPath)
            .screenshots({
                timestamps: [timestamp],
                filename: thumbnailName,
                folder: outputDir,
                size: "1280x720",
            })
            .on("end", () => {
                const thumbnailPath = path.join(outputDir, thumbnailName);
                console.log(`✅ Thumbnail generated: ${thumbnailPath}`);
                resolve(thumbnailPath);
            })
            .on("error", (err) => {
                console.error("❌ Error generating thumbnail:", err.message);
                reject(err);
            });
    });
};

/**
 * Get video metadata (duration, resolution, codec, etc.)
 * @param {string} inputPath - Path to the video file
 * @returns {Promise<Object>} - Video metadata
 */
const getVideoMetadata = (inputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) {
                console.error("❌ Error reading video metadata:", err.message);
                return reject(err);
            }

            const videoStream = metadata.streams.find(s => s.codec_type === "video");
            const audioStream = metadata.streams.find(s => s.codec_type === "audio");

            resolve({
                duration: metadata.format.duration,
                size: metadata.format.size,
                bitrate: metadata.format.bit_rate,
                format: metadata.format.format_name,
                video: videoStream ? {
                    codec: videoStream.codec_name,
                    width: videoStream.width,
                    height: videoStream.height,
                    fps: eval(videoStream.r_frame_rate),
                } : null,
                audio: audioStream ? {
                    codec: audioStream.codec_name,
                    sampleRate: audioStream.sample_rate,
                    channels: audioStream.channels,
                } : null,
            });
        });
    });
};

/**
 * Process video - compress to multiple resolutions
 * @param {string} inputPath - Path to original video
 * @param {string} outputDir - Base output directory
 * @returns {Promise<Object>} - Object with paths to all processed videos
 */
const processVideoMultiResolution = async (inputPath, outputDir) => {
    const results = {};
    const resolutions = ["360p", "480p", "720p"];

    for (const resolution of resolutions) {
        try {
            const outputPath = await compressVideo(inputPath, outputDir, resolution);
            results[resolution] = outputPath;
        } catch (err) {
            console.error(`⚠️ Skipping ${resolution}:`, err.message);
        }
    }

    return results;
};

/**
 * Clean up temporary processed files
 * @param {string[]} filePaths - Array of file paths to delete
 */
const cleanupTempFiles = (filePaths) => {
    for (const filePath of filePaths) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Cleaned up: ${filePath}`);
            }
        } catch (err) {
            console.error(`⚠️ Failed to clean up ${filePath}:`, err.message);
        }
    }
};

export {
    compressVideo,
    generateThumbnail,
    getVideoMetadata,
    processVideoMultiResolution,
    cleanupTempFiles,
};
