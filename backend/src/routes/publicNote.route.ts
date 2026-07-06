import express from 'express';
import {
    getNotesController,
    getTopNotesByEmojiController,
    getCommentsController,
    searchNotesController,
    incrementShareController,
    getSingleNoteController,
} from "../controllers/publicNote.controller";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
import { apiLimiter, searchRateLimiter, shareRateLimiter } from "../middleware/rateLimit.middleware";
import { checkMaintenanceMode } from "../middleware/systemSettings.middleware";

const router = express.Router();

router.use(apiLimiter);
router.use(checkMaintenanceMode);

router.get("/search", optionalAuth, searchRateLimiter, searchNotesController);
router.get("/", optionalAuth, getNotesController);
router.get("/top", optionalAuth, getTopNotesByEmojiController);
router.get("/:id", optionalAuth, getSingleNoteController);
router.get("/:id/comments", getCommentsController);
router.post("/:id/share", shareRateLimiter, incrementShareController);

export default router;