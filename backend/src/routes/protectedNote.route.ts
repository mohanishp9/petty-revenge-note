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
import { protect } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimit.middleware";
import { checkMaintenanceMode } from "../middleware/systemSettings.middleware";

const router = express.Router();

router.use(protect);
router.use(checkMaintenanceMode);

router.post("/", apiLimiter, createNoteController);
router.post("/:id/like", protect, toggleLikeController)
router.post("/:id/reaction", protect, reactionController)
router.post("/:id/comment", protect, addCommentController)
router.post("/comments/:commentId/reply", protect, addReplyController)
router.put("/comments/:commentId", protect, editCommentController)
router.delete("/comments/:commentId", protect, deleteCommentController)
router.get("/me", protect, getMyNotes)
router.delete("/:id", protect, deleteNoteController)

export default router;