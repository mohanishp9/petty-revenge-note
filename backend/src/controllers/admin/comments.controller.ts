import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import Comment from "../../models/Comment.model";
import Note from "../../models/Note.model";
import Reaction from "../../models/Reaction.model";

// @desc Get all comments for moderation
// @route GET /api/admin/comments
// @access Private (Admin)
export const getAllCommentsAdmin = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const sort = req.query.sort as string || "-createdAt";

    const query: any = {};
    if (search) {
        query.text = { $regex: search, $options: "i" };
    }

    const total = await Comment.countDocuments(query);
    
    const comments = await Comment.find(query)
        .populate("user", "username email")
        .populate("noteId", "subject")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return res.status(200).json({
        success: true,
        comments,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

// @desc Hard delete a comment and cascade delete replies/reactions
// @route DELETE /api/admin/comments/:id
// @access Private (Admin)
export const deleteCommentAdmin = asyncHandler(async (req: Request, res: Response) => {
    const commentId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const comment = await Comment.findById(commentId).session(session);
        if (!comment) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // 1. Delete all reactions on this specific comment
        await Reaction.deleteMany({ comment: comment._id }).session(session);

        // CASE 1: Deleting a top-level parent comment
        if (!comment.parentCommentId) {
            // Find all nested replies to delete their reactions too
            const replies = await Comment.find({ parentCommentId: comment._id }).session(session);
            const replyIds = replies.map(r => r._id);

            if (replyIds.length > 0) {
                await Reaction.deleteMany({ comment: { $in: replyIds } }).session(session);
            }

            // Delete all nested replies
            await Comment.deleteMany({ parentCommentId: comment._id }).session(session);

            // Decrement the note's commentsCount by 1
            await Note.updateOne(
                { _id: comment.noteId },
                { $inc: { commentsCount: -1 } },
                { session }
            );
        }
        // CASE 2: Deleting a nested reply
        else {
            // Update the parent comment's repliesCount tracking
            await Comment.updateOne(
                { _id: comment.parentCommentId },
                { $inc: { repliesCount: -1 } },
                { session }
            );
        }

        // 2. Delete the comment itself
        await Comment.deleteOne({ _id: comment._id }).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Comment purged successfully",
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
