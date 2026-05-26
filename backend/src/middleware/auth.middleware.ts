import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/User.model";
import Session from "../models/Session.model";
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";

/**
 * Authentication middleware for protected routes
 * Verifies the short-lived access token and checks if session is still valid
 * 
 * Access token should be sent in:
 * 1. Authorization header as Bearer token (preferred for API clients)
 * 2. Or in request body/header as 'accessToken' field
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Extract access token from multiple sources
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    // Check for token in custom header or body (for flexibility)
    const headerToken = req.headers["x-access-token"] as string | undefined;
    const bodyToken = req.body?.accessToken as string | undefined;

    const accessToken = bearerToken || headerToken || bodyToken;

    if (!accessToken) {
        res.status(401);
        throw new Error("Access token required. Please login again.");
    }

    // Verify the access token
    const decoded = verifyAccessToken(accessToken);

    if (!decoded || !decoded.userId || !decoded.sessionId) {
        res.status(401);
        throw new Error("Invalid or expired access token. Please refresh your token.");
    }

    // Check if session is still valid (not revoked)
    const session = await Session.findById(decoded.sessionId);

    if (!session) {
        res.status(401);
        throw new Error("Session not found. Please login again.");
    }

    if (session.revoked) {
        res.status(401);
        throw new Error("Session has been revoked. Please login again.");
    }

    if (session.userId.toString() !== decoded.userId) {
        res.status(401);
        throw new Error("Token user mismatch. Please login again.");
    }

    // Fetch user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
        res.status(401);
        throw new Error("User not found. Please login again.");
    }

    // Attach user and session info to request
    req.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
    };
    req.sessionId = decoded.sessionId;
    req.tokenPayload = decoded;

    next();
});

/**
 * Optional authentication middleware
 * Attaches user if valid token is present, but doesn't block if missing
 */
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    const headerToken = req.headers["x-access-token"] as string | undefined;
    const accessToken = bearerToken || headerToken;

    if (!accessToken) {
        return next();
    }

    try {
        const decoded = verifyAccessToken(accessToken);

        if (decoded && decoded.userId && decoded.sessionId) {
            const session = await Session.findById(decoded.sessionId);

            if (session && !session.revoked && session.userId.toString() === decoded.userId) {
                const user = await User.findById(decoded.userId).select("-password");

                if (user) {
                    req.user = {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                    };
                    req.sessionId = decoded.sessionId;
                    req.tokenPayload = decoded;
                }
            }
        }
    } catch (error) {
        // Silently continue without user
    }

    next();
});
