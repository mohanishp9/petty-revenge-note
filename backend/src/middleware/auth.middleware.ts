import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/User.model";
import type { Request, Response, NextFunction } from "express";
import type { JWTPayload } from "../utils/jwt";
import { verifyAccessToken } from "../utils/jwt";

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    // 1. Strictly check for Bearer token structure in the Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401);
        throw new Error("Not authenticated, token missing");
    }

    const accessToken = authHeader.slice("Bearer ".length);

    let decoded: JWTPayload;

    // 2. Verify the access token strictly using the access token verification helper
    try {
        decoded = verifyAccessToken(accessToken) as JWTPayload;
        if (!decoded || !decoded.id) {
            res.status(401);
            throw new Error("Invalid token structures");
        }
    } catch (error) {
        res.status(401);
        throw new Error("Invalid or expired token");
    }

    // 3. Load user and attach to req.user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }

    if (user.isBanned) {
        res.status(403);
        throw new Error("Your account has been banned");
    }

    req.user = user;
    next();
});

export { protect };