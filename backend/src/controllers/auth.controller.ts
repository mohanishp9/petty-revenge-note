import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from "../utils/validation";
import type { RegisterInput, LoginInput, VerifyOtpInput, ForgotPasswordInput, ResetPasswordInput } from "../utils/validation";
import User from "../models/User.model";
import Note from "../models/Note.model";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otpUtils";
import { sendOtpEmail } from "../services/emailService";
import redisClient from "../config/redis";
import type { Request, Response } from "express";

// Redis Key Helper
const otpRedisKey = (email: string) => `auth:register:${email.toLowerCase().trim()}`;

// Redis Payload Type
interface OtpRegisterPayload {
    otpHash: string;
    attempts: number;
    userData: {
        username: string;
        email: string;
        password: string; // plain — User model pre-save hook will hash it
    };
}

// OTP Registration Controllers

// @desc  Step 1 — Validate user data, generate OTP, store payload in Redis, send email
// @route POST /auth/register/initiate
// @access Public
const initiateRegistration = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate input
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const { username, email, password }: RegisterInput = result.data;

    // 2. Check if email or username already registered in DB
    const userExist = await User.findOne({ $or: [{ email }, { username }] });
    if (userExist) {
        return res.status(409).json({
            success: false,
            message: userExist.email === email ? "Email already registered" : "Username already taken",
        });
    }

    // 3. Generate OTP and hash it
    const plainOtp = generateOtp();
    const otpHash = await hashOtp(plainOtp);

    // 4. Build Redis payload — store plain password so User model pre-save hook can hash it
    const payload: OtpRegisterPayload = {
        otpHash,
        attempts: 0,
        userData: { username, email, password },
    };

    // 5. Save to Redis with 10-min TTL — overwrites any previous OTP for this email (uniqueness guaranteed)
    await redisClient.set(otpRedisKey(email), JSON.stringify(payload), "EX", 600);

    // 6. Send OTP email (throws on total failure after retries)
    await sendOtpEmail(email, plainOtp, "REGISTER");

    return res.status(200).json({
        success: true,
        message: "OTP sent to your email. It expires in 10 minutes.",
    });
});

// @desc  Resend OTP — generate fresh OTP, keep existing userData, reset TTL
// @route POST /auth/register/resend
// @access Public
const resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    // 1. Retrieve existing Redis payload to preserve userData
    const raw = await redisClient.get(otpRedisKey(email));
    if (!raw) {
        return res.status(400).json({
            success: false,
            message: "No pending registration found. Please start registration again.",
        });
    }

    const existing: OtpRegisterPayload = JSON.parse(raw);

    // 2. Generate a fresh OTP
    const plainOtp = generateOtp();
    const otpHash = await hashOtp(plainOtp);

    // 3. Build updated payload — keep userData, reset attempts
    const updatedPayload: OtpRegisterPayload = {
        otpHash,
        attempts: 0,
        userData: existing.userData,
    };

    // 4. Overwrite Redis key with fresh OTP + reset TTL to 10 min
    await redisClient.set(otpRedisKey(email), JSON.stringify(updatedPayload), "EX", 600);

    // 5. Send new OTP email
    await sendOtpEmail(email, plainOtp, "REGISTER");

    return res.status(200).json({
        success: true,
        message: "New OTP sent to your email.",
    });
});

// @desc  Step 2 — Verify OTP, create user, issue tokens
// @route POST /auth/register/verify
// @access Public
const verifyRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate input
    const result = verifyOtpSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const { email, otp }: VerifyOtpInput = result.data;
    const key = otpRedisKey(email);

    // 2. Fetch Redis payload
    const raw = await redisClient.get(key);
    if (!raw) {
        // Redis TTL expired or key never existed
        return res.status(400).json({
            success: false,
            message: "OTP expired or invalid. Please request a new one.",
        });
    }

    const payload: OtpRegisterPayload = JSON.parse(raw);

    // 3. Attempt limit check — max 5 wrong attempts
    if (payload.attempts >= 5) {
        await redisClient.del(key); // clean up — force user to restart
        return res.status(429).json({
            success: false,
            message: "Maximum attempts exceeded. Please request a new OTP.",
        });
    }

    // 4. Verify OTP hash
    const isValid = await verifyOtp(otp, payload.otpHash);
    if (!isValid) {
        // Increment attempts and persist back with remaining TTL
        const ttl = await redisClient.ttl(key); // get remaining seconds
        payload.attempts += 1;
        const remainingTtl = ttl > 0 ? ttl : 600;
        await redisClient.set(key, JSON.stringify(payload), "EX", remainingTtl);

        const attemptsLeft = 5 - payload.attempts;
        return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
        });
    }

    // 5. OTP valid — create user (pre-save hook in User model will hash the password)
    const { username, email: userEmail, password } = payload.userData;

    // Double-check: race condition guard — ensure user wasn't created between initiate and verify
    const alreadyExists = await User.findOne({ $or: [{ email: userEmail }, { username }] });
    if (alreadyExists) {
        await redisClient.del(key);
        return res.status(409).json({
            success: false,
            message: alreadyExists.email === userEmail ? "Email already registered" : "Username already taken",
        });
    }

    const user = await User.create({ username, email: userEmail, password });

    // 6. Cleanup Redis key immediately
    await redisClient.del(key);

    // 7. Issue tokens — same pattern as existing login
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
        success: true,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
        },
        accessToken,
    });
});

// @desc Login a user
// @route POST /login
// @access Public
const loginUserController = asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const validatedData = result.data;
    const { email, password }: LoginInput = validatedData;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid Credentials",
        });
    }

    if (await user.comparePassword(password)) {
        // Create access token
        const accessToken = generateAccessToken(user._id.toString());
        // Create refresh token
        const refreshToken = generateRefreshToken(user._id.toString());
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            // sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            accessToken: accessToken,
        })
    } else {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }
});

// @desc Refresh access token
// @route POST /refresh
// @access Public
const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No refresh token provided",
        })
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        })
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User not found",
        })
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            // sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

    return res.status(200).json({
        success: true,
        accessToken: accessToken,
    });
});

// @desc Logout a user
// @route POST /logout
// @access Private
const logoutUserController = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        // sameSite: "strict",
    });
    return res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

// @desc Get current user profile
// @route GET /profile
// @access Private
const getCurrentUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    const [userFromDB, notes] = await Promise.all([
        User.findById(req.user._id)
            .select("_id username email")
            .lean(),
        Note.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean()
    ]);

    res.status(200).json({
        success: true,
        user: userFromDB,
    });
});

// Password Reset Controllers

const resetRedisKey = (email: string) => `auth:reset:${email.toLowerCase().trim()}`;

// @desc  Forgot Password — Send OTP
// @route POST /auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const { email }: ForgotPasswordInput = result.data;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        // Prevent email enumeration
        return res.status(200).json({
            success: true,
            message: "If an account with that email exists, an OTP has been sent.",
        });
    }

    const plainOtp = generateOtp();
    const otpHash = await hashOtp(plainOtp);

    // Keep all state in one JSON object for atomic manipulation
    const payload = { otpHash, attempts: 3 };
    await redisClient.set(resetRedisKey(email), JSON.stringify(payload), "EX", 600);
    await sendOtpEmail(email, plainOtp, "PASSWORD_RESET");

    res.status(200).json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
    });
});

// @desc  Reset Password — Verify OTP and update password
// @route POST /auth/reset-password
// @access Public
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const { email, otp, newPassword }: ResetPasswordInput = result.data;
    const key = resetRedisKey(email);

    await redisClient.watch(key);
    const raw = await redisClient.get(key);

    if (!raw) {
        await redisClient.unwatch();
        return res.status(400).json({
            success: false,
            message: "OTP expired or invalid. Please request a new one.",
        });
    }

    const data = JSON.parse(raw);
    if (data.attempts <= 0) {
        await redisClient.unwatch();
        await redisClient.del(key);
        return res.status(400).json({
            success: false,
            message: "Maximum attempts exceeded. Please request a new OTP.",
        });
    }

    // Decrement attempts atomically via MULTI/EXEC
    data.attempts -= 1;
    const multi = redisClient.multi();
    multi.set(key, JSON.stringify(data), "KEEPTTL");
    const execResult = await multi.exec();

    if (!execResult) {
        // WATCH interrupted by another process
        return res.status(409).json({
            success: false,
            message: "Concurrent request detected. Please try again.",
        });
    }

    // After successfully decrementing, verify hash
    const isValid = await verifyOtp(otp, data.otpHash);
    
    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${data.attempts} attempt${data.attempts === 1 ? "" : "s"} remaining.`,
        });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    // Verify it's not the same as the current password (optional but best practice)
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
        return res.status(400).json({
            success: false,
            message: "New password must be different from current password",
        });
    }

    // Update password (triggers pre-save bcrypt hook)
    user.password = newPassword;
    await user.save();

    await redisClient.del(key);

    res.status(200).json({
        success: true,
        message: "Password reset successfully.",
    });
});

export {
    initiateRegistration,
    resendOtp,
    verifyRegistrationOtp,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
    forgotPassword,
    resetPassword,
};