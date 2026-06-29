import express from 'express';
import { checkUsername, updateUsername, initiateEmailUpdate, verifyEmailUpdate, updatePassword, deleteAccountInitiate, deleteAccountConfirm } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { apiLimiter, otpRequestLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

// Real-time username availability check
router.get('/profile/check-username', protect, checkUsername);

// Update username
router.put('/profile/username', protect, apiLimiter, updateUsername);

// Email update flow
router.post('/profile/email/initiate', protect, otpRequestLimiter, initiateEmailUpdate);
router.post('/profile/email/verify', protect, apiLimiter, verifyEmailUpdate);

// Update password
router.put('/profile/password', protect, apiLimiter, updatePassword);

// Account deletion — two-step: password + OTP
router.post('/profile/delete/initiate', protect, otpRequestLimiter, deleteAccountInitiate);
router.post('/profile/delete/confirm', protect, apiLimiter, deleteAccountConfirm);

export default router;
