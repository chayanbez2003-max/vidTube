import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    startStream,
    endStream,
    getLiveStreams,
    getStreamById,
    getMyStream,
    sendChatMessage,
    getPastStreams,
} from "../controllers/stream.controller.js";

const router = Router();

// Public routes
router.route("/live").get(getLiveStreams);
router.route("/past").get(getPastStreams);
router.route("/:streamId").get(getStreamById);

// Protected routes (require login)
router.use(verifyJWT);

router.route("/start").post(startStream);
router.route("/end/:streamId").post(endStream);
router.route("/my-stream").get(getMyStream);
router.route("/:streamId/chat").post(sendChatMessage);

export default router;
