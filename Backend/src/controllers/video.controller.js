import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";


const getAllVideos = asyncHandler(async (req, res)=>{

    const {page = 1 , limit = 10, query, sortBy , sortType, userId} = req.query;

    const pipeline = [];

    if(query){
        pipeline.push({
            $search:{
                index: "video_search",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
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
                        username: 1,
                        "avatar.url": 1
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

    const{title, description} = req.body;

    if([title, description].some((field)=> field?.trim()=== "")){
        throw new ApiError(400, "All fields are required");
    }
    
    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailFileLocalPath = req.files?.thumbnail[0].path;

    if(!videoFileLocalPath || !thumbnailFileLocalPath){
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath);

    if(!videoFile){
        throw new ApiError(500, "Unable to upload video file");
    }
    if(!thumbnailFile){
        throw new ApiError(500, "Unable to upload thumbnail file");
    }
 
    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile:{
            url: videoFile.secure_url,
            publicId: videoFile.public_id
        },
        thumbnail:{
            url: thumbnailFile.secure_url,
            publicId: thumbnailFile.public_id
        },
        owner:{
            _id: req.user?._id
        },
        isPublished: true
    })

    const videoUploaded = await Video.findById(video._id)

    if(!videoUploaded){
        throw new ApiError(500, "Video Upload failed , please try again" )
    }

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
                                username: 1,
                                "avatar.url": 1,
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

        // increment view if video is fetched successfully

        await Video.findByIdAndUpdate(videoId,{
            $inc: {
                views: 1
            }
        });

        // add video to user's watch history

        await User.findByIdAndUpdate(req.user?._id,{
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


export {
    getAllVideos, 
    publishVideo, 
    getVideoById, 
    updateVideo, 
    deleteVideo, 
    togglePublishStatus
};
