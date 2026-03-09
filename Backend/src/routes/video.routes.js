import { Router } from "express";
import { 
    getAllVideos,
    getVideoById,
    publishVideo,
    deleteVideo,
    updateVideo,
    togglePublishStatus,
    getTrendingVideosList,
    refreshTrendingScores,
    getUploadSignature
} from "../controllers/video.controller.js";
import { upload} from "../middlewares/multer.middleware.js";

import {verifyJWT} from "../middlewares/auth.middleware.js";
import {authorizeRoles} from "../middlewares/role.middleware.js";

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        publishVideo
    )

    // Direct Cloudinary Upload Signature
    router.route("/sign-upload").get(verifyJWT, getUploadSignature);

    // Trending routes
    router.route("/trending").get(getTrendingVideosList);
    router.route("/refresh-trending").post(verifyJWT, authorizeRoles("admin"), refreshTrendingScores);

    router
         .route("/:videoId")
         .get(verifyJWT, getVideoById)
         .delete(verifyJWT, deleteVideo)
         .patch(verifyJWT, upload.single("thumbnail"),updateVideo)
         
    router
        .route("/toggle/publish/:videoId")
        .patch(verifyJWT, togglePublishStatus);

export default router;