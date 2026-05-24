import express from 'express';
import {
    createNoteController,
    toggleLikeController,
    reactionController,
    addCommentController,
    addReplyController,
    getMyNotes,
    deleteNoteController,
    editCommentController,
    deleteCommentController
} from "../controllers/protectedNote.controller";
import { apiLimiter } from "../middleware/rateLimit.middleware";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.use(apiLimiter)

router.post("/", protect, createNoteController)
router.post("/:id/like", protect, toggleLikeController)
router.post("/:id/reaction", protect, reactionController)
router.post("/:id/comment", protect, addCommentController)
router.post("/comments/:commentId/reply", protect, addReplyController)
router.put("/comments/:commentId", protect, editCommentController)
router.delete("/comments/:commentId", protect, deleteCommentController)
router.get("/me", protect, getMyNotes)
router.delete("/:id", protect, deleteNoteController)

export default router;