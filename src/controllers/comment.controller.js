import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Comment} from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//get all comments for a video
const getVideoCommnets =  asyncHandler(async(req , res) =>{
    const {videoId} = req.params;
    const {page =1 , limit =10} = req.query;

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError (404, "Video not found");
    }
    
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                state: "ACTIVE"
            }
        },
        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as: "owner"
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField:"comment",
                as: "likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user?._id, "$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                
                content: 1,
                createdAt:1,
                owner:{
                    username:1,
                    fullName:1,
                    "avatar.url": 1
                },
                isLiked:1,
                likesCount:1
            }
        }
    ])

    const options ={
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(commentsAggregate, options)

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

// add a comment to a video
 const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params;
    const {content} = req.body;
    
    if(!content){
        throw new ApiError(400, "Content is required to add a comment");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    
    const comment = await Comment.create({
        content,
        video: video._id,
        owner: req.user?._id,

    })

    if(!comment){
        throw new ApiError(500, "Failed to add comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )

 })

// update comment
const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "Content is required to update a comment");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        {new: true}
    );
    if(!updatedComment){
        throw new ApiError(500, "Failed to update comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    );

    return res.status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

// delete comment
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found");
    }
    if(comment.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    });

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found or unauthorized");
    }

    await Like.deleteMany({
        comment: commentId
    })


    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted Successfully")
    )
   
})


export {
    getVideoCommnets,
    addComment,
    updateComment,
    deleteComment
} 