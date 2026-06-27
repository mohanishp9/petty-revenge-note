import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import User from '../models/User.model';
import redisClient from '../config/redis';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otpUtils';
import { sendOtpEmail } from '../services/emailService';

export const checkUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.query;
    const userId = req.user?._id;

    if (!username || typeof username !== 'string') {
        res.status(400);
        throw new Error('Username is required');
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
        res.status(400);
        throw new Error('Username cannot be empty');
    }

    // Exclude the current user so they can "keep" their own username
    const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
        _id: { $ne: userId }
    });

    res.status(200).json({
        success: true,
        available: !existingUser
    });
});

export const updateUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        res.status(400);
        throw new Error('Valid username is required');
    }

    const trimmedUsername = username.trim();

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: trimmedUsername },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404);
            throw new Error('User not found');
        }

        res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'Username updated successfully'
        });
    } catch (error: any) {
        // Catch MongoDB duplicate key error specifically for race conditions
        if (error.code === 11000) {
            res.status(409);
            throw new Error('Username is already taken');
        }
        throw error;
    }
});

export const initiateEmailUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { newEmail, password } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!newEmail || typeof newEmail !== 'string') {
        res.status(400);
        throw new Error('New email is required');
    }

    if (!password) {
        res.status(400);
        throw new Error('Current password is required');
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Verify current password
    const user = await User.findById(userId).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect password');
    }

    if (normalizedEmail === user.email) {
        res.status(400);
        throw new Error('New email must be different from your current email');
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        res.status(409);
        throw new Error('Email is already in use by another account');
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    // Save to Redis (10 minutes expiry)
    const redisKey = `auth:email_update:${userId}`;
    const payload = {
        otpHash,
        attempts: 0,
        newEmail: normalizedEmail
    };

    await redisClient.set(redisKey, JSON.stringify(payload), 'EX', 600);

    // Send email to the NEW address
    await sendOtpEmail(normalizedEmail, otp, 'EMAIL_CHANGE');

    res.status(200).json({
        success: true,
        message: 'OTP sent to new email address',
        email: normalizedEmail
    });
});

export const verifyEmailUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { otp } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!otp || typeof otp !== 'string') {
        res.status(400);
        throw new Error('OTP is required');
    }

    const redisKey = `auth:email_update:${userId}`;
    const rawPayload = await redisClient.get(redisKey);

    if (!rawPayload) {
        res.status(400);
        throw new Error('OTP expired or not found. Please initiate email change again.');
    }

    const payload = JSON.parse(rawPayload);

    if (payload.attempts >= 3) {
        await redisClient.del(redisKey);
        res.status(429);
        throw new Error('Maximum attempts exceeded. Please start over.');
    }

    const isOtpValid = await verifyOtp(otp, payload.otpHash);

    if (!isOtpValid) {
        payload.attempts += 1;
        const remainingTtl = await redisClient.ttl(redisKey);
        await redisClient.set(redisKey, JSON.stringify(payload), 'EX', remainingTtl);
        
        res.status(400);
        throw new Error(`Invalid OTP. ${3 - payload.attempts} attempts remaining.`);
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { email: payload.newEmail },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404);
            throw new Error('User not found');
        }

        // Clean up Redis
        await redisClient.del(redisKey);

        res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'Email updated successfully'
        });
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(409);
            throw new Error('Email is already taken by another account');
        }
        throw error;
    }
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide both current and new passwords');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters long');
    }

    if (currentPassword === newPassword) {
        res.status(400);
        throw new Error('New password must be different from current password');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password');
    }

    // Set new password and save (mongoose pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    });
});
