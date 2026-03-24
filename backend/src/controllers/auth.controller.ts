import { asyncHandler } from "../utils/asyncHandler.js";
import { registerSchema, loginSchema } from "../utils/validation.js";
import type { RegisterInput, LoginInput } from "../utils/validation.js";
import User from "../models/User.model.js";
import Note from "../models/Note.model.js";
import { generateToken } from "../utils/jwt.js";
import type { Request, Response } from "express";

// @desc Create a new user
// @route POST /register
// @access Public
const registerUserController = asyncHandler(async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);

    if(!result.success) {
        res.status(400);
        const errorMessages = result.error.issues.map(issue => issue.message);
        throw new Error(errorMessages.join(", "));
    }
    const validatedData = result.data;

    const { username, email, password }: RegisterInput = validatedData;

    const userExist = await User.findOne({ email });

    if (userExist) {
        res.status(409);
        throw new Error("User already exists");
    }

    const user = await User.create({
        username,
        email,
        password,
    })

    if (user) {
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            // secure: true,
            // sameSite: "none",
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        })
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// @desc Login a user
// @route POST /login
// @access Public
const loginUserController = asyncHandler(async (req: Request, res: Response ) => {
    const result = loginSchema.safeParse(req.body);

    if(!result.success) {
        res.status(400);
        const errorMessages = result.error.issues.map(issue => issue.message);
        throw new Error(errorMessages.join(", "));
    }

    const validatedData = result.data;

    const { email, password }: LoginInput = validatedData;

    const user = await User.findOne({ email });

    if(!user) {
        res.status(401);
        throw new Error("Invalid Credentials");
    }

    if(await user.comparePassword(password)) {
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            // secure: true,
            // sameSite: "none",
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        })
    } else {
        res.status(401);
        throw new Error("Invalid credentials");
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
        res.status(401);
        throw new Error("User not found");
    }
    const notes = await Note.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

    const user = {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
    };
    res.status(200).json({
        success: true,
        user,
        notes
    })
})

export {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
};