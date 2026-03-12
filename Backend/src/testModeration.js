import "dotenv/config";
import { checkImageModeration } from "./utils/rekognition.js";

const runTest = async () => {
  try {

    const result = await checkImageModeration("./nsfw-test.jpg");

    console.log("Moderation Result:", result);

  } catch (error) {
    console.error("Error:", error);
  }
};

runTest();