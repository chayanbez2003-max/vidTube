import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import { sendEmail, getVerificationEmailHTML, getPasswordResetEmailHTML } from "../utils/sendEmail.js";

const generateAccessTokenandRefreshToken=async (userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken =user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return{accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}



const registerUser = asyncHandler( async (req, res) => {
    const{username, email, password, fullName} = req.body;
    // console.log("email:", email);

    if([fullName, username, email, password].some(field => 
        field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required");
    }
    
    const existedUser =await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(400, "Username or email already exists");
    }

     console.log(req.files);
   
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage?.[0]?.path;


    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){   
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Failed to upload avatar");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:  username.toLowerCase()
    });
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500," Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )
} )

const loginUser =  asyncHandler( async(req,res)=>{
    const{username, password,email} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username and email are required!");
    }

   const user= await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials");
    }

    const {accessToken, refreshToken} =await generateAccessTokenandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
    "User logged in successfully"
    ))
})


const logoutUser= asyncHandler(async(req,res)=>{
       await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true 
            }
        )

    
    const options = {
    httpOnly: true,
    secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
    })

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET, 
        )
    
        const  user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        const {accessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(user._id)
    
        const options= {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newrefreshToken", newrefreshToken, options)
        .json(
            new ApiResponse
            (
                200,
                {accessToken, newrefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})
    

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
   }

   user.password = newPassword;
   await user.save({validateBeforeSave:false}); //You use { validateBeforeSave: false } to skip unnecessary schema validations when you’re only updating a small field (like passsword) and don’t want to risk unrelated validation errors.

   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        {},
        "Password Changed Successfully"
    )
   )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,
        req.user,
        "Current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const{fullName,email} = req.body
    if(!fullName||!email){
        throw new ApiError(400,"All fildes are required")
    }

    const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            fullName,
            email:email
        }
    },
    {
        new:true,
    }
).select("-password")

return res
.status(200)
.json(
    new ApiResponse(
        200,
        user,
        "Account details updated successully"
    )
)
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    
const user =   await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
         avatar:avatar.url
       }
    },
    {new:true}
).select("-password")

return res
.status(200)
.json(
    new ApiResponse(
        200,
        user.toObject(),
        "Avatar image updated successfully"
    )
)

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while updating cover image")
    }


const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage : coverImage.url
        }
    },
    {new:true}
).select("-password")

return res
.status(200)
.json(
    new ApiResponse(
        200,
        user.toObject(),
        "Cover image updated successfully"
    )
)

})
    
const getUserchannelProfile = asyncHandler(async (req,res)=>{
    const {username}= req.params
    if(!username?.trim())
        {
        throw new ApiError(400,"username is missing")
        
    }
    
    const channel = await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
               subscribersCount:{
                $size:"$subscribers"
               },
               channelsSubscribedToCount:{
                $size:"$subscribedTo"
               },
               isSubscribed:{
                $cond:{
                    if:{
                        $in:[ req.user?._id,"$subscribers.subscriber"]
               },
                    then:true,
                    else:false
               } 
            }
        }
        },
        {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            coverImage:1,
            avatar:1,
            email:1 
        
        }
        }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel not found")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        channel[0],
        "User channel fetched successfully"
    )
  )

})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

// ==================== EMAIL VERIFICATION ====================

const sendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "vidTube — Verify Your Email",
            html: getVerificationEmailHTML(user.username, verificationUrl),
        });

        return res.status(200).json(
            new ApiResponse(200, {}, "Verification email sent successfully")
        );
    } catch (error) {
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Failed to send verification email");
    }
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Email verified successfully")
    );
});

// ==================== PASSWORD RESET ====================

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Don't reveal if email exists — security best practice
        return res.status(200).json(
            new ApiResponse(200, {}, "If an account with that email exists, a password reset link has been sent.")
        );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "vidTube — Reset Your Password",
            html: getPasswordResetEmailHTML(user.username, resetUrl),
        });

        return res.status(200).json(
            new ApiResponse(200, {}, "If an account with that email exists, a password reset link has been sent.")
        );
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Failed to send password reset email");
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined; // Force re-login on all devices
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully. Please login with your new password.")
    );
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserchannelProfile,
    getWatchHistory,
    sendVerificationEmail,
    verifyEmail,
    forgotPassword,
    resetPassword
}
