import jwt from 'jsonwebtoken';
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/User.model";
import type { Request, Response, NextFunction } from "express";
import type { JWTPayload } from "../utils/jwt";
import { verifyToken } from "../utils/jwt"

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = req.cookies?.token as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

    const token = cookieToken || bearerToken;

    if (!token) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    let decoded: JWTPayload;

    try {
        decoded = verifyToken(token) as JWTPayload;
        if (!decoded || !decoded.id) {
            res.status(401);
            throw new Error("Invalid token");
        }
    } catch (error) {
        res.status(401);
        throw new Error("Invalid token");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }

    req.user = user;
    next();
});

export { protect };