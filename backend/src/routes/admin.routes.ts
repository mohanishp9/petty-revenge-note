import express from "express";
import { getDashboardStats } from "../controllers/admin/dashboard.controller";
import { getAllPublicUsers, getPublicUserById, toggleUserBan, deletePublicUser } from "../controllers/admin/users.controller";
import { getAllNotesAdmin, deleteNoteAdmin, getNoteReportsAdmin } from "../controllers/admin/notes.controller";
import { getAllCommentsAdmin, deleteCommentAdmin } from "../controllers/admin/comments.controller";
import { getSystemSettings, updateSystemSettings } from "../controllers/admin/settings.controller";
import { protectAdmin } from "../middleware/adminAuth.middleware";

const router = express.Router();

// All routes here are protected by adminAuth middleware
router.use(protectAdmin);

router.get("/dashboard/stats", getDashboardStats);

router.get("/users", getAllPublicUsers);
router.get("/users/:id", getPublicUserById);
router.put("/users/:id/ban", toggleUserBan);
router.delete("/users/:id", deletePublicUser);

router.get("/notes", getAllNotesAdmin);
router.get("/notes/:id/reports", getNoteReportsAdmin);
router.delete("/notes/:id", deleteNoteAdmin);

router.get("/comments", getAllCommentsAdmin);
router.delete("/comments/:id", deleteCommentAdmin);

router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);

export default router;
