import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Stream} from "../models/stream.model.js"
import {createNotification} from "./notification.controller.js"


const toggleVideoLike = asyncHandler(async (req, res) => {

    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Invalid video ID");
    }
    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    }) 

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false}
            )
        )
    }

    await Like.create({
        video:videoId,
        likedBy: req.user?._id,
    })

    // Send notification to video owner
    const video = await Video.findById(videoId).select("owner title");
    if (video) {
        await createNotification({
            recipient: video.owner,
            sender: req.user._id,
            type: "like",
            message: `${req.user.username} liked your video "${video.title}"`,
            video: videoId,
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked:true}
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Invalid comment ID");
    }
    const likedAlready = await Like.findOne({
        comment : commentId,
        likedBy : req.user?._id
        })
    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked:false}
            )
        )
    }
    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Comment liked")
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    // 🔁 UNLIKE
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);

        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked")
        );
    }

    // ❤️ LIKE
    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Tweet liked")
    );
});

const toggleStreamLike = asyncHandler(async (req, res) => {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
        throw new ApiError(400, "Invalid stream Id");
    }

    const likedAlready = await Like.findOne({
        stream: streamId,
        likedBy: req.user._id
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);

        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Stream unliked")
        );
    }

    await Like.create({
        stream: streamId,
        likedBy: req.user._id
    });

    // Notify streamer
    const stream = await Stream.findById(streamId).select("streamer title");
    if (stream) {
        await createNotification({
            recipient: stream.streamer,
            sender: req.user._id,
            type: "like",
            message: `${req.user.username} liked your live stream "${stream.title}"`,
            // Since there's no stream field in notification yet, we might want to add it or use a generic one
        });
    }

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Stream liked")
    );
});

const getLikedVideos = asyncHandler(async (req, res)=>{

    const likedVideoAggregate = await Like.aggregate([
        {

            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideo",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        },
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo:{
                    _id: 1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    owner:1,
                    title:1,
                    description:1,
                    views:1,
                    createdAt:1,
                    isPublished:1,
                    ownerDetails:{
                        _id: 1,
                        username:1,
                        fullName:1,
                        avatar:1
                    }
                }
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideoAggregate,
            "Liked videos fetched successfully"
        )
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    toggleStreamLike,
    getLikedVideos
}
