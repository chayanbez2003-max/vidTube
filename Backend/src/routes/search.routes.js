import { Router } from "express";
import { searchVideos, getSearchSuggestions, getTrendingSearches } from "../controllers/search.controller.js";

const router = Router();

// Public routes — no auth required for searching
router.route("/").get(searchVideos);
router.route("/suggestions").get(getSearchSuggestions);
router.route("/trending").get(getTrendingSearches);

export default router;
