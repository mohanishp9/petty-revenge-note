import express from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
} from "../controllers/auth.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", protect, logoutUserController);
router.get("/profile", protect, getCurrentUserProfileController);

export default router;