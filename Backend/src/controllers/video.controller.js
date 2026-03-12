import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js";
import { uploadOnCloudinary, deleteOnCloudinary, generateUploadSignature } from "../utils/cloudinary.js";
import { checkVideoModeration, checkImageModeration } from "../utils/rekognition.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Subscription } from "../models/subscription.model.js";
import { createNotification } from "./notification.controller.js";


const getAllVideos = asyncHandler(async (req, res)=>{

    const {page = 1 , limit = 10, query, sortBy , sortType, userId} = req.query;

    const pipeline = [];

    if(query){
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });   
    }
    
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid userId")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // sorting videos whose isPublished is true
    pipeline.push({
        $match:{
            isPublished: true
        }
    })

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)

    if(sortBy && sortType){
        pipeline.push({
            $sort:{
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }
    else{
        //default sorting by createdAt descending
        pipeline.push({
            $sort:{ createdAt: -1 }
        })
    }

    pipeline.push(
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    },
    {
        $unwind: "$ownerDetails"
    }
    )

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const result = await Video.aggregatePaginate(pipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"));

})
 

// get video, upload to cloudinary, create video

const publishVideo = asyncHandler(async(req, res)=>{

    const { title, description, tags, category, videoUrl, videoPublicId, thumbnailUrl, thumbnailPublicId, duration } = req.body;

    if([title, description, videoUrl, thumbnailUrl].some((field)=> !field || field.trim()=== "")){
        throw new ApiError(400, "All fields are required");
    }
    
    // --- Content Moderation ---
    // Since video and thumbnail are uploaded from frontend directly to Cloudinary,
    // we must moderate them by passing their URLs right here before saving them to DB.
    const [thumbnailMod, videoMod] = await Promise.all([
        checkImageModeration(thumbnailUrl),
        checkVideoModeration(videoUrl)
    ]);

    if (thumbnailMod.isExplicit || videoMod.isExplicit) {
        // If they are explicit, we delete them from Cloudinary since they shouldn't exist!
        await deleteOnCloudinary(videoPublicId, "video");
        await deleteOnCloudinary(thumbnailPublicId);
        
        const explicitSource = videoMod.isExplicit ? "Video" : "Thumbnail";
        const explicitLabels = videoMod.isExplicit ? videoMod.labels : thumbnailMod.labels;
        
        throw new ApiError(400, `${explicitSource} contains explicit content: ${explicitLabels.map(l => l.Name).join(", ")}`);
    }
    // --- End Content Moderation ---

    // Parse tags — accept comma-separated string or array
    let parsedTags = [];
    if (tags) {
        parsedTags = Array.isArray(tags) 
            ? tags.map(t => typeof t === 'string' ? t.trim().toLowerCase() : t).filter(Boolean)
            : typeof tags === 'string' ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    }

    const video = await Video.create({
        title,
        description,
        duration: duration || 0,
        videoFile:{
            url: videoUrl,
            publicId: videoPublicId
        },
        thumbnail:{
            url: thumbnailUrl,
            publicId: thumbnailPublicId
        },
        owner:{
            _id: req.user?._id
        },
        isPublished: true,
        tags: parsedTags,
        category: category || 'other'
    })

    const videoUploaded = await Video.findById(video._id)

    if(!videoUploaded){
        throw new ApiError(500, "Video Upload failed , please try again" )
    }

    // Notify all subscribers about the new video
    const subscribers = await Subscription.find({ channel: req.user._id }).select("subscriber");
    subscribers.forEach(sub => {
        createNotification({
            recipient: sub.subscriber,
            sender: req.user._id,
            type: "upload",
            message: `${req.user.username} uploaded a new video: "${title}"`,
            video: video._id,
        });
    });

    return res
    .status(200)
    .json(new ApiResponse(200, videoUploaded, "Video uploaded successfully"));
})

// get video by id

const getVideoById = asyncHandler(async(req, res)=>{
        const {videoId} = req.params

        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid videoId")
        }

        if(!isValidObjectId(req.user?._id)){
            throw new ApiError(400, "Invalid userId")
        }

        const video = await Video.aggregate([

            {
                $match:{
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup:{
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $lookup:{
                                from:"subscriptions",
                                localField:"_id",
                                foreignField:"channel",
                                as:"subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: {
                                    $size:"$subscribers"
                                },
                                isSubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [
                                                req.user?._id,
                                                "$subscribers.subscriber"
                                            ]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1
                            }
                        },

                    ]
                }
            },
            {
                $addFields: {
                    likesCount:{
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked: {
                        $cond: {
                            if: {
                                $in: [
                                    req.user?._id,
                                    "$likes.likedBy"
                                ]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    owner: 1,
                    likesCount: 1,
                    isLiked: 1
                }
            } 
        ]);

        if(!video){
            throw new ApiError(500,"failed to fetch video, please try again")
        }

        // Only increment view count if user hasn't viewed this video before
        const currentUser = await User.findById(req.user?._id).select("watchHistory");
        const alreadyViewed = currentUser?.watchHistory?.some(
            (id) => id.toString() === videoId
        );

        if (!alreadyViewed) {
            await Video.findByIdAndUpdate(videoId, {
                $inc: { views: 1 }
            });
        }

        // add video to user's watch history (addToSet prevents duplicates)
        await User.findByIdAndUpdate(req.user?._id, {
            $addToSet: {
                watchHistory: videoId
            }
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, video[0], "Video fetched successfully")
            );
})

// update video details like title, description, thumbnail etc

const updateVideo = asyncHandler(async(req, res)=>{
        const {title, description} = req.body;
        const {videoId} = req.params;

        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid videoId")
        }

        if(!(title && description)){
            throw new ApiError(400, "Title and description are required")
        }

        const video = await Video.findById(videoId)

        if(!video){
            throw new ApiError(404, "Video not found")
        }

        if (!req.user || !req.user._id) {
            throw new ApiError(401, "Authentication required");
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this video");
        }

        // if(video?.owner.toString() !== req.user?._id.toString()){
        //     throw new ApiError(403, "You are not authorized to update this video")
        // }

        // deleting old thumbnail and updating with new one

        const thumbnailToDelete = video.thumbnail.public_id

        const thumbnailLocalPath = req.file?.path

        if(!thumbnailLocalPath){
            throw new ApiError(400, "Thumbnail is required")
        }

        const thumbnailMod = await checkImageModeration(thumbnailLocalPath);
        if (thumbnailMod.isExplicit) {
            throw new ApiError(400, `Thumbnail contains explicit content: ${thumbnailMod.labels.map(l => l.Name).join(", ")}`);
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnail){
            throw new ApiError(500, "Unable to upload thumbnail")
        }

        const updatedVideo = await Video.findByIdAndUpdate((videoId),{
            $set: {
                title,
                description,
                thumbnail: {
                    url: thumbnail.secure_url,
                    public_id: thumbnail.public_id
                }
            }
        },{ new: true }
    )

    if(!updatedVideo){
        throw new ApiError(500, "Unable to update video, please try again")
    }
    if(updatedVideo){
        await deleteOnCloudinary(thumbnailToDelete)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

// delete video

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId)

    if(!videoDeleted){
        throw new ApiError(500, "Unable to delete video, please try again")
    }

    // delete video and thumbnail from cloudinary
    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id, "video");

    //delete related likes, comments, etc 

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})

// toggle published status of the video

const togglePublishStatus = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You can't change publish status of this video")
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished: !video?.isPublished
        }
    }, {new: true});

    return res
    .status(200)
    .json(
        new ApiResponse(200, toggledVideoPublish, "Video publish status updated successfully")
    )
})

// Get trending videos
const getTrendingVideosList = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;
    
    const trendingVideos = await Video.aggregate([
        { $match: { isPublished: true } },
        { $sort: { trendingScore: -1, views: -1 } },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } }
                ]
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                title: 1,
                "thumbnail.url": 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                trendingScore: 1,
                tags: 1,
                category: 1,
                ownerDetails: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, trendingVideos, "Trending videos fetched"));
});

// Manually trigger trending score update (admin or cron)
import { updateAllTrendingScores } from "../utils/trending.js";

const refreshTrendingScores = asyncHandler(async (req, res) => {
    const count = await updateAllTrendingScores();
    return res
        .status(200)
        .json(new ApiResponse(200, { updatedCount: count }, "Trending scores refreshed"));
});

// Generate Cloudinary Signature for direct frontend uploads
const getUploadSignature = asyncHandler(async (req, res) => {
    const signatureData = generateUploadSignature();
    return res.status(200).json(
        new ApiResponse(200, signatureData, "Upload signature generated successfully")
    );
});


export {
    getAllVideos, 
    publishVideo, 
    getVideoById, 
    updateVideo, 
    deleteVideo, 
    togglePublishStatus,
    getTrendingVideosList,
    refreshTrendingScores,
    getUploadSignature
};
