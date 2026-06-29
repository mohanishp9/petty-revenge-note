import express from "express";
import {
    initiateRegistration,
    resendOtp,
    verifyRegistrationOtp,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { otpRequestLimiter } from "../middleware/rateLimit.middleware";

const router = express.Router();

router.post("/refresh", refreshTokenController);
router.post("/register/initiate", otpRequestLimiter, initiateRegistration);
router.post("/register/resend",   otpRequestLimiter, resendOtp);
router.post("/register/verify",   verifyRegistrationOtp);
router.post("/login",   loginUserController);
router.post("/logout",  logoutUserController);
router.get("/profile",  protect, getCurrentUserProfileController);

router.post("/forgot-password", otpRequestLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;