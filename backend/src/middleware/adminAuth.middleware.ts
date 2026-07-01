import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyAccessToken } from "../utils/jwt";
import AdminUser from "../models/AdminUser.model";
import { IAdminUser } from "../types/adminUser.types";

// Extend Express Request to include adminUser
declare global {
    namespace Express {
        interface Request {
            adminUser?: IAdminUser;
        }
    }
}

export const protectAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Check header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else {
        // Alternatively, check cookies if we are passing accessToken via cookie
        // But normally accessToken is passed in headers, and refreshToken in cookies.
        // We will stick to the standard: accessToken in headers, refreshToken in cookies.
        // Actually, for admin panel, we can use the same pattern as public app.
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token",
        });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }

    // Fetch the admin user
    const adminUser = await AdminUser.findById(decoded.id).select("-password").lean();

    if (!adminUser) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, admin user not found",
        });
    }

    req.adminUser = adminUser as IAdminUser;
    next();
});

export const requireSuperAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (req.adminUser && req.adminUser.isSuperAdmin) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Not authorized as super admin",
        });
    }
});
