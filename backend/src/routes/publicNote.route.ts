import express from 'express';
import {
    getNotesController,
    getTopNotesByEmojiController,
    getCommentsController,
    searchNotesController,
} from "../controllers/publicNote.controller";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { apiLimiter, searchRateLimiter } from "../middleware/rateLimit.middleware";
import { checkMaintenanceMode } from "../middleware/systemSettings.middleware";

const router = express.Router();

router.use(apiLimiter);
router.use(checkMaintenanceMode);

router.get("/search", optionalAuth, searchRateLimiter, searchNotesController);
router.get("/", optionalAuth, getNotesController);
router.get("/top", getTopNotesByEmojiController);
router.get("/:id/comments", getCommentsController);

export default router;