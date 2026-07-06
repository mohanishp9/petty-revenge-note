import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken, JWTPayload } from "../utils/jwt";
import mongoose from "mongoose";

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    if (!cookieToken && !bearerToken) {
        return next();
    }

    let decoded: JWTPayload | null = null;
    
    if (bearerToken) {
        decoded = verifyAccessToken(bearerToken);
    } else if (cookieToken) {
        decoded = verifyRefreshToken(cookieToken);
    }

    if (decoded) {
        req.user = {
            _id: new mongoose.Types.ObjectId(decoded.id)
        };
    }
    next();
};
