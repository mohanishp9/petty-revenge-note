import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, loginSchema } from "../utils/validation";
import type { RegisterInput, LoginInput } from "../utils/validation";
import User from "../models/User.model";
import Note from "../models/Note.model";
import { generateToken } from "../utils/jwt";
import type { Request, Response } from "express";

// @desc Create a new user
// @route POST /register
// @access Public
const registerUserController = asyncHandler(async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }
    const validatedData = result.data;

    const { username, email, password }: RegisterInput = validatedData;

    const userExist = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (userExist) {
        return res.status(409).json({
            success: false,
            message:
                userExist.email === email
                    ? "Email already registered"
                    : "Username already taken",
        });
    }

    const user = await User.create({
        username, // done
        email, // done
        password, // done
    })

    if (user) {
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            token: jwtToken,
        })
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid user data",
        });
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
            message: result.error.issues.map((i: any) => i.message).join(", "),
        });
    }

    const validatedData = result.data;
    const { email, password }: LoginInput = validatedData;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid Credentials",
        });
    }

    if (await user.comparePassword(password)) {
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
            token: jwtToken,
        })
    } else {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }
});

// @desc Logout a user
// @route POST /logout
// @access Private
const logoutUserController = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

// @desc Get current user profile
// @route GET /profile
// @access Private
const getCurrentUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    const [userFromDB, notes] = await Promise.all([
        User.findById(req.user._id)
            .select("_id username email")
            .lean(),
        Note.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean()
    ]);

    res.status(200).json({
        success: true,
        user: userFromDB,
    });
});

export {
    registerUserController, // done
    loginUserController, // done
    logoutUserController, // done
    getCurrentUserProfileController, // done
};