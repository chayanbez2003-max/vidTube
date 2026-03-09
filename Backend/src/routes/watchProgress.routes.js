import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    updateWatchProgress, 
    getWatchProgress, 
    getContinueWatching 
} from "../controllers/watchProgress.controller.js";

const router = Router();

// All watch progress routes require authentication
router.use(verifyJWT);

router.route("/continue-watching").get(getContinueWatching);
router.route("/:videoId")
    .get(getWatchProgress)
    .post(updateWatchProgress);

export default router;
