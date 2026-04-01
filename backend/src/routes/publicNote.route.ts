import express from 'express';
import {
    getNotesController,
    getTopFiveNotesByEmojiController,
    getCommentsController,
} from "../controllers/publicNote.controller.ts";
import { optionalAuth } from "../middleware/optionalAuth.middleware.ts";
import { apiLimiter } from "../middleware/rateLimit.middleware.ts";

const router = express.Router();

router.use(apiLimiter)

router.get("/", optionalAuth, getNotesController);
router.get("/top5", getTopFiveNotesByEmojiController);
router.get("/:id/comments", getCommentsController);

export default router;