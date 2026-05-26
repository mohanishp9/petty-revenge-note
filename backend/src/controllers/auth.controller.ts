import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, loginSchema, refreshTokenSchema, logoutAllSchema } from "../utils/validation";
import type { RegisterInput, LoginInput, RefreshTokenInput, LogoutAllInput } from "../utils/validation";
import User from "../models/User.model";
import Session from "../models/Session.model";
import mongoose from "mongoose";
import type { Request, Response } from "express";
import {
    generateAccessToken,
    generateRefreshTokenString,
    generateRefreshTokenJWT,
    verifyRefreshTokenJWT,
    getRefreshTokenCookieOptions,
    getClearRefreshTokenCookieOptions,
} from "../utils/tokens";

/**
 * Helper function to clear auth cookies
 */
const clearAuthCookies = (res: Response): void => {
    res.clearCookie("refreshToken", getClearRefreshTokenCookieOptions());
};

/**
 * Helper function to revoke all sessions for a user
 * Used when detecting potential token theft
 */
const revokeAllUserSessions = async (userId: mongoose.Types.ObjectId): Promise<void> => {
    await Session.updateMany(
        { userId, revoked: false },
        { revoked: true }
    );
};

/**
 * Helper function to extract client info from request
 */
const getClientInfo = (req: Request) => ({
    ip: (req.ip || req.headers["x-forwarded-for"] as string || req.socket?.remoteAddress || "unknown").toString(),
    userAgent: req.headers["user-agent"] || "unknown",
});

// @desc Register a new user
// @route POST /register
// @access Public
const registerUserController = asyncHandler(async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i) => i.message).join(", "),
        });
    }

    const validatedData = result.data;
    const { username, email, password }: RegisterInput = validatedData;

    // Check if user already exists
    const userExist = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (userExist) {
        return res.status(409).json({
            success: false,
            message:
                userExist.email === email
                    ? "Email already registered"
                    : "Username already taken",
        });
    }

    // Start a session for transaction
    const dbSession = await mongoose.startSession();

    try {
        dbSession.startTransaction();

        // Create user
        const [user] = await User.create(
            [{ username, email, password }],
            { session: dbSession }
        );

        if (!user) {
            await dbSession.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Failed to create user",
            });
        }

        // Generate tokens
        const refreshTokenString = generateRefreshTokenString();
        const clientInfo = getClientInfo(req);

        // Create session with PLAIN refresh token (will be hashed by pre-save hook)
        const [session] = await Session.create(
            [
                {
                    userId: user._id,
                    refreshTokenHash: refreshTokenString, // Pre-save hook will hash this
                    ip: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    revoked: false,
                },
            ],
            { session: dbSession }
        );

        if (!session) {
            await dbSession.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Failed to create session",
            });
        }

        // Generate JWT tokens
        const accessToken = generateAccessToken(user._id.toString(), session._id.toString());
        const refreshTokenJWT = generateRefreshTokenJWT(
            user._id.toString(),
            session._id.toString(),
            refreshTokenString
        );

        // Commit transaction
        await dbSession.commitTransaction();

        // Set refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshTokenJWT, getRefreshTokenCookieOptions());

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            accessToken,
        });
    } catch (error) {
        await dbSession.abortTransaction();
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
        });
    } finally {
        dbSession.endSession();
    }
});

// @desc Login a user
// @route POST /login
// @access Public
const loginUserController = asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i) => i.message).join(", "),
        });
    }

    const validatedData = result.data;
    const { email, password }: LoginInput = validatedData;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }

    // Start a session for transaction
    const dbSession = await mongoose.startSession();

    try {
        dbSession.startTransaction();

        // Generate tokens
        const refreshTokenString = generateRefreshTokenString();
        const clientInfo = getClientInfo(req);

        // Create session with PLAIN refresh token (will be hashed by pre-save hook)
        const [session] = await Session.create(
            [
                {
                    userId: user._id,
                    refreshTokenHash: refreshTokenString, // Pre-save hook will hash this
                    ip: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    revoked: false,
                },
            ],
            { session: dbSession }
        );

        if (!session) {
            await dbSession.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Failed to create session",
            });
        }

        // Generate JWT tokens
        const accessToken = generateAccessToken(user._id.toString(), session._id.toString());
        const refreshTokenJWT = generateRefreshTokenJWT(
            user._id.toString(),
            session._id.toString(),
            refreshTokenString
        );

        // Commit transaction
        await dbSession.commitTransaction();

        // Set refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshTokenJWT, getRefreshTokenCookieOptions());

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            accessToken,
        });
    } catch (error) {
        await dbSession.abortTransaction();
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
        });
    } finally {
        dbSession.endSession();
    }
});

// @desc Refresh access token (with Token Rotation)
// @route POST /refresh
// @access Public (requires valid refresh token)
const refreshTokensController = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token ONLY from cookie
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
        console.log("Refresh token missing from cookies");
        return res.status(401).json({
            success: false,
            message: "Refresh token required",
        });
    }

    // Verify the refresh token JWT
    const decoded = verifyRefreshTokenJWT(refreshToken);

    if (!decoded || !decoded.userId || !decoded.sessionId) {
        clearAuthCookies(res);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token",
        });
    }

    const { userId, sessionId, tokenFamily } = decoded;

    // Find the session
    const session = await Session.findById(sessionId);

    // CRITICAL: REUSE DETECTION & SECRET VERIFICATION
    // Allow a short grace period (30s) for revoked sessions to handle multi-tab races
    const GRACE_PERIOD_MS = 30000;
    const isWithinGracePeriod = session?.revoked && session.rotatedAt && 
                               (Date.now() - session.rotatedAt.getTime() < GRACE_PERIOD_MS);

    let isInvalid = !session || (session.revoked && !isWithinGracePeriod);
    
    if (session && !isInvalid && tokenFamily) {
        const isSecretValid = await session.compareRefreshToken(tokenFamily);
        if (!isSecretValid) {
            isInvalid = true;
        }
    } else if (!tokenFamily) {
        isInvalid = true;
    }

    if (isInvalid) {
        console.warn(`SECURITY ALERT: Refresh token reuse or invalid secret detected for user ${userId}, session ${sessionId}`);
        
        // Revoke ALL sessions for this user - account lockdown
        await revokeAllUserSessions(new mongoose.Types.ObjectId(userId));

        // Clear cookies
        clearAuthCookies(res);

        return res.status(401).json({
            success: false,
            message: "Security alert: Token reuse detected. All sessions have been revoked. Please login again.",
            securityIncident: true,
        });
    }

    // If we're within grace period, we don't rotate again, just return a new access token
    if (isWithinGracePeriod) {
        console.log(`Grace period triggered for user ${userId}, session ${sessionId}`);
        const accessToken = generateAccessToken(userId, sessionId);
        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully (grace period)",
            accessToken,
        });
    }

    // Verify session belongs to correct user
    if (session!.userId.toString() !== userId) {
        console.warn(`SECURITY ALERT: Session user mismatch for user ${userId}, session ${sessionId}`);
        
        await revokeAllUserSessions(new mongoose.Types.ObjectId(userId));
        clearAuthCookies(res);

        return res.status(401).json({
            success: false,
            message: "Invalid session. Please login again.",
        });
    }

    // Start transaction for token rotation
    const dbSession = await mongoose.startSession();

    try {
        dbSession.startTransaction();

        // ATOMIC REVOCATION: Only one concurrent request can successfully find and revoke
        // an un-revoked session. This eliminates the race window.
        const sessionToRotate = await Session.findOneAndUpdate(
            { _id: sessionId, revoked: false },
            { $set: { revoked: true, rotatedAt: new Date() } },
            { session: dbSession, new: true }
        );

        if (!sessionToRotate) {
            console.warn(`SECURITY ALERT: Race condition or reuse detected for user ${userId}, session ${sessionId}`);
            await dbSession.abortTransaction();
            
            // If it failed because it was already revoked, lock down the account
            await revokeAllUserSessions(new mongoose.Types.ObjectId(userId));
            clearAuthCookies(res);

            return res.status(401).json({
                success: false,
                message: "Security alert: Token reuse detected. All sessions have been revoked.",
                securityIncident: true,
            });
        }

        // Generate NEW refresh token
        const newRefreshTokenString = generateRefreshTokenString();
        const clientInfo = getClientInfo(req);

        // Create NEW session with the new refresh token
        const [newSession] = await Session.create(
            [
                {
                    userId: sessionToRotate.userId,
                    refreshTokenHash: newRefreshTokenString, // Pre-save hook will hash this
                    ip: clientInfo.ip,
                    userAgent: clientInfo.userAgent,
                    revoked: false,
                },
            ],
            { session: dbSession }
        );

        if (!newSession) {
            await dbSession.abortTransaction();
            clearAuthCookies(res);
            return res.status(500).json({
                success: false,
                message: "Failed to create new session",
            });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(userId, newSession._id.toString());
        const newRefreshTokenJWT = generateRefreshTokenJWT(
            userId,
            newSession._id.toString(),
            newRefreshTokenString
        );

        // Commit transaction
        await dbSession.commitTransaction();

        // Set new refresh token in cookie
        res.cookie("refreshToken", newRefreshTokenJWT, getRefreshTokenCookieOptions());

        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        await dbSession.abortTransaction();
        console.error("Token refresh error:", error);
        clearAuthCookies(res);
        return res.status(500).json({
            success: false,
            message: "An error occurred during token refresh",
        });
    } finally {
        dbSession.endSession();
    }
});

// @desc Logout from current session
// @route POST /logout
// @access Private
const logoutUserController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.sessionId) {
        // No session, just clear cookies
        clearAuthCookies(res);
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }

    // Revoke the current session
    await Session.findByIdAndUpdate(req.sessionId, { revoked: true });

    // Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

// @desc Logout from ALL devices (revoke all sessions)
// @route POST /logout-all
// @access Private
const logoutAllDevicesController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }

    const userId = req.user._id;

    // Revoke all sessions for this user
    const result = await Session.updateMany(
        { userId, revoked: false },
        { revoked: true }
    );

    // Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
        success: true,
        message: `Logged out from all devices successfully. ${result.modifiedCount} session(s) revoked.`,
        sessionsRevoked: result.modifiedCount,
    });
});

// @desc Get all active sessions for the current user
// @route GET /sessions
// @access Private
const getActiveSessionsController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }

    const sessions = await Session.find({
        userId: req.user._id,
        revoked: false,
    })
        .select("-refreshTokenHash")
        .sort({ createdAt: -1 });

    // Mark current session
    const sessionsWithCurrent = sessions.map((session) => ({
        _id: session._id,
        ip: session.ip,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isCurrentSession: session._id.toString() === req.sessionId,
    }));

    return res.status(200).json({
        success: true,
        count: sessionsWithCurrent.length,
        sessions: sessionsWithCurrent,
    });
});

// @desc Revoke a specific session
// @route DELETE /sessions/:sessionId
// @access Private
const revokeSessionController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }

    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required",
        });
    }

    // Find and revoke the session (only if it belongs to the current user)
    const session = await Session.findOne({
        _id: sessionId,
        userId: req.user._id,
    });

    if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found",
        });
    }

    if (session.revoked) {
        return res.status(400).json({
            success: false,
            message: "Session is already revoked",
        });
    }

    // Prevent revoking current session (user should use logout instead)
    if (sessionId === req.sessionId) {
        return res.status(400).json({
            success: false,
            message: "Cannot revoke current session. Use /logout endpoint instead.",
        });
    }

    session.revoked = true;
    await session.save();

    return res.status(200).json({
        success: true,
        message: "Session revoked successfully",
    });
});

// @desc Get current user profile
// @route GET /profile
// @access Private
const getCurrentUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User not found",
        });
    }

    // User is already attached by the protect middleware
    return res.status(200).json({
        success: true,
        user: {
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
        },
    });
});

export {
    registerUserController,
    loginUserController,
    refreshTokensController,
    logoutUserController,
    logoutAllDevicesController,
    getActiveSessionsController,
    revokeSessionController,
    getCurrentUserProfileController,
};
