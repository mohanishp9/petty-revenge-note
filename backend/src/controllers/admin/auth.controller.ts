import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginSchema, LoginInput } from "../../utils/validation";
import AdminUser from "../../models/AdminUser.model";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";

// @desc Login Admin
// @route POST /api/admin/auth/login
// @access Public
export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const { email, password }: LoginInput = result.data;
    const admin = await AdminUser.findOne({ email }).select("+password");

    if (!admin) {
        return res.status(401).json({
            success: false,
            message: "Invalid Credentials",
        });
    }

    if (await admin.comparePassword(password)) {
        const accessToken = generateAccessToken(admin._id.toString());
        const refreshToken = generateRefreshToken(admin._id.toString());
        
        // We use a separate cookie name for the admin refresh token to prevent collision with the public app
        res.cookie("adminRefreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            user: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                isSuperAdmin: admin.isSuperAdmin,
            },
            accessToken,
        });
    } else {
        return res.status(401).json({
            success: false,
            message: "Invalid Credentials",
        });
    }
});

// @desc Refresh Admin access token
// @route POST /api/admin/auth/refresh
// @access Public
export const refreshAdminToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.adminRefreshToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No refresh token provided",
        });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
    }

    const admin = await AdminUser.findById(decoded.id);
    if (!admin) {
        return res.status(401).json({
            success: false,
            message: "Admin not found",
        });
    }

    const accessToken = generateAccessToken(admin._id.toString());
    const refreshToken = generateRefreshToken(admin._id.toString());
    
    res.cookie("adminRefreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        success: true,
        accessToken,
    });
});

// @desc Logout Admin
// @route POST /api/admin/auth/logout
// @access Private (Admin)
export const logoutAdmin = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("adminRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
        success: true,
        message: "Successfully logged out",
    });
});

// @desc Get current admin profile
// @route GET /api/admin/auth/profile
// @access Private (Admin)
export const getAdminProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.adminUser) {
        return res.status(401).json({
            success: false,
            message: "Admin not found",
        });
    }

    const adminFromDB = await AdminUser.findById(req.adminUser._id)
        .select("_id name email isSuperAdmin")
        .lean();

    return res.status(200).json({
        success: true,
        user: adminFromDB,
    });
});

// @desc Change admin password
// @route PUT /api/admin/auth/password
// @access Private (Admin)
export const changeAdminPassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.adminUser) {
        return res.status(401).json({
            success: false,
            message: "Admin not found",
        });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password and new password are required",
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters long",
        });
    }

    const admin = await AdminUser.findById(req.adminUser._id).select("+password");

    if (!admin) {
        return res.status(404).json({
            success: false,
            message: "Admin not found",
        });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Incorrect current password",
        });
    }

    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
});
