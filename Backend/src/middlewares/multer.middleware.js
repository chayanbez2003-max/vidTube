import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary is already configured in utils/cloudinary.js which is imported
// elsewhere, but we configure it here again to be self-contained in case this
// middleware is loaded before cloudinary.js.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── memoryStorage ─────────────────────────────────────────────────────────────
// Files are buffered in RAM instead of written to disk.
// This avoids ALL local path / ENOENT issues on any hosting platform.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});

// ── uploadBufferToCloudinary ───────────────────────────────────────────────────
// Helper: upload a Buffer (from memoryStorage) straight to Cloudinary.
// Returns the full Cloudinary response object (with .secure_url, .public_id …).
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "vidtube-uploads", ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};