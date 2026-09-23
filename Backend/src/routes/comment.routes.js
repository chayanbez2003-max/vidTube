import { Router } from "express";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    addComment,
    addStreamComment,
    updateComment,
    deleteComment,
    getVideoCommnets,
    getStreamComments
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/:videoId")
    .get(optionalVerifyJWT, getVideoCommnets)
    .post(verifyJWT, upload.none(), addComment);

router.route("/s/:streamId")
    .get(optionalVerifyJWT, getStreamComments)
    .post(verifyJWT, upload.none(), addStreamComment);

router.route("/c/:commentId")
    .delete(verifyJWT, deleteComment)
    .patch(verifyJWT, upload.none(), updateComment);

export default router;