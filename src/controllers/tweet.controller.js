import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"

0
// creating a tweet.

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id

    })
    if(!tweet){
        throw new ApiError(500, "Failed to create tweet")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
    )
})

// update tweet
const updateTweet = asyncHandler(async (req, res)=>{
    const {tweetId} = req.params
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Tweet content is required to update")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweet._id,
        {
            $set:{
                content,
            }
        },
        {new:true}
    )
    if(!updatedTweet){
        throw new ApiError(500, "Failed to update tweet")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
})

//Delete tweet 
const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(500, "Invalid tweet ID")
    }
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet not found")
    }
    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "You are not authorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweet._id)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {tweetId},
            "Tweet deleted successfully"
        )
    )
})

//get user tweet

const getUserTweets = asyncHandler(async(req, res)=>{
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid user ID")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
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
                    },
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as:"likeDetails",
                pipeline: [
                    {
                        $project:{
                            likedBy:1
                        },                 
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond:{
                        if: {
                            $in:[req.user?._id , "$likeDetails.likedBy"]
                        },
                        then: true,
                        else: false
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
                ownerDetails: 1,
                likesCount: 1,
                isLiked: 1,
                createdAt: 1,
            }
        }
    ]);
     
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    )

})




export{
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}