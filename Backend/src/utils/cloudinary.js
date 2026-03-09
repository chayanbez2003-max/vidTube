import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        }
        return null;
    }
}

const deleteOnCloudinary = async(public_id, resourceType="image")=>{
    try{
        if(!public_id) return null;

        //delete the file on cloudinary
        const result = await cloudinary.uploader.destroy(public_id,{
            resource_type: `${resourceType}`
        })
    }
    catch(error){
        return error;
        console.log("error while deleting file on cloudinary ", error);
    }
} 

const generateUploadSignature = () => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { timestamp },
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        timestamp,
        signature,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY
    };
};

export {uploadOnCloudinary, deleteOnCloudinary, generateUploadSignature};