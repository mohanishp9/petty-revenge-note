import express from 'express';
import {
    getNotesController,
    getTopFiveNotesByEmojiController,
} from "../controllers/note.controller.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.use(apiLimiter)

router.get("/", getNotesController);
router.get("/top5/:emoji", getTopFiveNotesByEmojiController);

export default router;