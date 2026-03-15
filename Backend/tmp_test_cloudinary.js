import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

fs.writeFileSync("test.txt", "test file content for cloudinary upload");

cloudinary.uploader.upload_large("test.txt", { resource_type: "auto" })
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
    fs.unlinkSync("test.txt");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    fs.unlinkSync("test.txt");
    process.exit(1);
  });
