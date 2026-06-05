import express from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/refresh", refreshTokenController)
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", logoutUserController);
router.get("/profile", protect, getCurrentUserProfileController);

export default router;