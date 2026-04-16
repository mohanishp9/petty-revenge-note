import express from 'express';
import {
    createNoteController,
    toggleLikeController,
    reactionController,
    addCommentController,
    getMyNotes,
} from "../controllers/protectedNote.controller";
import { apiLimiter } from "../middleware/rateLimit.middleware";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.use(apiLimiter)

router.post("/", protect, createNoteController)
router.post("/:id/like", protect, toggleLikeController)
router.post("/:id/reaction", protect, reactionController)
router.post("/:id/comment", protect, addCommentController)
router.get("/me", protect, getMyNotes)

export default router;