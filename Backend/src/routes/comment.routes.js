import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {
    addComment,
    addStreamComment,
    updateComment,
    deleteComment,
    getVideoCommnets,
    getStreamComments
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT, upload.none());
router.route("/:videoId").get(getVideoCommnets).post(addComment);
router.route("/s/:streamId").get(getStreamComments).post(addStreamComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)





export default router;