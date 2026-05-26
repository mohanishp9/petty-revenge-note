import express from "express";
import {
    registerUserController,
    loginUserController,
    refreshTokensController,
    logoutUserController,
    logoutAllDevicesController,
    getActiveSessionsController,
    revokeSessionController,
    getCurrentUserProfileController,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/refresh", refreshTokensController);

// Protected routes (require valid access token)
router.post("/logout", protect, logoutUserController);
router.post("/logout-all", protect, logoutAllDevicesController);
router.get("/sessions", protect, getActiveSessionsController);
router.delete("/sessions/:sessionId", protect, revokeSessionController);
router.get("/profile", protect, getCurrentUserProfileController);

export default router;
