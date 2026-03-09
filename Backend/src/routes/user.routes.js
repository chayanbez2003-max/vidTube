import { Router } from "express";
import {loginUser,logoutUser,registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, getWatchHistory, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserchannelProfile, sendVerificationEmail, verifyEmail, forgotPassword, resetPassword } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

    router.route("/login").post(loginUser)

    router.route("/logout").post(verifyJWT , logoutUser)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT,changeCurrentPassword)
    router.route("/current-user").get(verifyJWT,getCurrentUser)
    router.route("/update-account").patch(verifyJWT,updateAccountDetails)
    router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
    router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
    router.route("/c/:username").get(verifyJWT, getUserchannelProfile)
    router.route("/history").get(verifyJWT, getWatchHistory)

    // Email verification routes
    router.route("/send-verification-email").post(verifyJWT, sendVerificationEmail)
    router.route("/verify-email/:token").get(verifyEmail)

    // Password reset routes (public — no auth needed)
    router.route("/forgot-password").post(forgotPassword)
    router.route("/reset-password/:token").post(resetPassword)

export default router;