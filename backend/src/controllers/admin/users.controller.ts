import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import User from "../../models/User.model";
import Note from "../../models/Note.model";
import Comment from "../../models/Comment.model";
import Like from "../../models/Like.model";
import Reaction from "../../models/Reaction.model";

// @desc Get all public users
// @route GET /api/admin/users
// @access Private (Admin)
export const getAllPublicUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const sort = req.query.sort as string || "-createdAt";

    const query: any = {};
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const total = await User.countDocuments(query);
    
    // We use .lean() for faster execution because these are read-only
    const users = await User.find(query)
        .select("-password")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return res.status(200).json({
        success: true,
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

// @desc Get single public user by ID with stats
// @route GET /api/admin/users/:id
// @access Private (Admin)
export const getPublicUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).select("-password").lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    const [notesCount, commentsCount] = await Promise.all([
        Note.countDocuments({ user: user._id }),
        Comment.countDocuments({ user: user._id }),
    ]);

    return res.status(200).json({
        success: true,
        user: {
            ...user,
            stats: {
                notes: notesCount,
                comments: commentsCount,
            }
        },
    });
});

// @desc Toggle public user ban status
// @route PUT /api/admin/users/:id/ban
// @access Private (Admin)
export const toggleUserBan = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    return res.status(200).json({
        success: true,
        message: `User successfully ${user.isBanned ? 'banned' : 'unbanned'}`,
        user: {
            _id: user._id,
            username: user.username,
            isBanned: user.isBanned,
        }
    });
});

// @desc Hard delete public user and cascade delete everything
// @route DELETE /api/admin/users/:id
// @access Private (Admin)
export const deletePublicUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 1. Find all note IDs belonging to this user
        const noteIds = (await Note.distinct("_id", { user: userId }).session(session)) as mongoose.Types.ObjectId[];

        // 2. Delete ALL comments on those notes (including from other users)
        await Comment.deleteMany({ noteId: { $in: noteIds } }).session(session);

        // 3. Delete ALL likes on those notes (field is noteId not note)
        await Like.deleteMany({ noteId: { $in: noteIds } }).session(session);

        // 4. Delete ALL reactions on those notes
        await Reaction.deleteMany({ note: { $in: noteIds } }).session(session);

        // 5. Delete the user's notes
        await Note.deleteMany({ user: userId }).session(session);
        
        // 6. Delete any remaining comments the user posted on OTHER people's notes
        await Comment.deleteMany({ user: userId }).session(session);

        // 7. Delete any remaining likes the user cast on other notes (field is userId)
        await Like.deleteMany({ userId: userId }).session(session);

        // 8. Delete any remaining reactions the user cast on other notes
        await Reaction.deleteMany({ user: userId }).session(session);

        // 9. Delete the user
        await User.findByIdAndDelete(userId).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "User and all associated data permanently deleted",
        });
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Transaction failed",
            error: error.message,
        });
    }
});
