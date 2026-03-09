import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getChannelAnalytics, 
    getVideoAnalytics 
} from "../controllers/analytics.controller.js";

const router = Router();

// All analytics routes require authentication
router.use(verifyJWT);

router.route("/channel").get(getChannelAnalytics);
router.route("/video/:videoId").get(getVideoAnalytics);

export default router;
