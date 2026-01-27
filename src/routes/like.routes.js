import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { toggleVideoLike } from "../controllers/like.controller.js";
import { toggleCommentLike } from "../controllers/like.controller.js";
import { toggleTweetLike } from "../controllers/like.controller.js";
import { getLikedVideos } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);             
router.route("/videos").get(getLikedVideos);

export default router;