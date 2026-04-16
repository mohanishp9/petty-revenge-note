import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import mongoose from "mongoose";

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = req.cookies?.token as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;
    const token = cookieToken || bearerToken;

    if (!token) {
        return next();
    }

    const decoded = verifyToken(token);

    if (decoded) {
        req.user = {
            _id: new mongoose.Types.ObjectId(decoded.id)
        };
    }
    next();
};
