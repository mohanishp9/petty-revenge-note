import express from 'express';
import {
    getNotesController,
    getTopNotesByEmojiController,
    getCommentsController,
} from "../controllers/publicNote.controller.ts";
import { optionalAuth } from "../middleware/optionalAuth.middleware.ts";
import { apiLimiter } from "../middleware/rateLimit.middleware.ts";

const router = express.Router();

router.use(apiLimiter)

router.get("/", optionalAuth, getNotesController);
router.get("/top", getTopNotesByEmojiController);
router.get("/:id/comments", getCommentsController);

export default router;