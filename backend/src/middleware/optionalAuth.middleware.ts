import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";
import User from "../models/User.model";
import Session from "../models/Session.model";

/**
 * Optional authentication middleware
 * Attaches user if valid token is present, but doesn't block if missing
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    // Extract access token from multiple sources
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
                }
            }
        }
    } catch (error) {
        // Silently continue without user
    }

    next();
};
