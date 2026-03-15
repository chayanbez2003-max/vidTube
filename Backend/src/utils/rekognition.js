import AWS from "aws-sdk";
import fs from "fs";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const rekognition = new AWS.Rekognition();

export const checkImageModeration = async (imagePathOrUrl) => {
  try {
    let imageBytes;

    if (imagePathOrUrl.startsWith("http")) {
      const { default: axios } = await import("axios");
      const response = await axios.get(imagePathOrUrl, { responseType: 'arraybuffer' });
      imageBytes = Buffer.from(response.data, 'binary');
    } else {
      imageBytes = fs.readFileSync(imagePathOrUrl);
    }
    
    const params = {
      Image: {
        Bytes: imageBytes,
      },
      MinConfidence: 75
    };

    const response = await rekognition.detectModerationLabels(params).promise();
    
    const unsafeLabels = response.ModerationLabels 
      ? response.ModerationLabels.filter(label => label.Confidence >= 50) 
      : [];
    
    if (unsafeLabels.length > 0) {
      return {
        isExplicit: true,
        labels: unsafeLabels
      };
    }
    
    return {
      isExplicit: false,
      labels: []
    };
  } catch (error) {
    console.error("Error checking image moderation:", error);
    throw new Error("Failed to check image moderation");
  }
};

/**
 * Checks video moderation by sampling multiple frames throughout the video.
 * @param {string} cloudinaryVideoUrl - The full Cloudinary URL of the uploaded video
 */
export const checkVideoModeration = async (cloudinaryVideoUrl) => {
  try {
    const { default: axios } = await import("axios");

    // Replace the format with .jpg to get a frame. 
    // We remove any existing transformations from the URL if present, or just the extension.
    const baseUrl = cloudinaryVideoUrl.replace(".mp4", ".jpg").replace(".webm", ".jpg");
    
    // Sample frames at different timeline positions (e.g. 10%, 50%, 90%)
    // Cloudinary supports start offset in percentages (e.g., so_10p)
    const offsets = ['so_10p', 'so_50p', 'so_90p'];
    
    // Process frames in parallel to save time
    const moderationChecks = offsets.map(async (offset) => {
      // Create the specific frame URL
      const frameUrl = baseUrl.replace("/upload/", `/upload/${offset}/`);
      
      try {
        const response = await axios.get(frameUrl, { responseType: 'arraybuffer' });
        const imageBytes = Buffer.from(response.data, 'binary');

        const params = {
          Image: {
            Bytes: imageBytes,
          },
          MinConfidence: 75
        };

        const rekognitionResponse = await rekognition.detectModerationLabels(params).promise();
        
        return rekognitionResponse.ModerationLabels 
          ? rekognitionResponse.ModerationLabels.filter(label => label.Confidence >= 75) 
          : [];
      } catch (err) {
        console.warn(`Failed to process frame at offset ${offset}:`, err.message);
        return [];
      }
    });

    // Wait for all frame checks to complete
    const results = await Promise.all(moderationChecks);
    
    // Flatten the labels array from all frames
    const allUnsafeLabels = results.flat();
    
    // if any unsafe labels are found return them else return empty array  
    if (allUnsafeLabels.length > 0) {
      // Remove duplicate labels by name to return a clean summary
      const uniqueLabels = Array.from(new Map(allUnsafeLabels.map(item => [item.Name, item])).values());
      
      return {
        isExplicit: true,
        labels: uniqueLabels
      };
    }
    
    return {
      isExplicit: false,
      labels: []
    };
  } catch (error) {
    console.error("Error checking video moderation:", error);
    throw new Error("Failed to check video moderation");
  }
};