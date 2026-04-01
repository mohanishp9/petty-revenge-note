import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JWTPayload } from "../utils/jwt.ts";
import { verifyToken } from "../utils/jwt.ts";
import mongoose from "mongoose";

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1] as string;

    const decoded = verifyToken(token);

    if (decoded) {
        req.user = {
            _id: new mongoose.Types.ObjectId(decoded.id)
        };
    }
    next();
};