import { asyncHandler } from "../utils/asyncHandler";
import Note from "../models/Note.model";
import Like from "../models/Like.model";
import Reaction from "../models/Reaction.model";
import Comment from "../models/Comment.model";
import { createNoteSchema } from "../utils/note.validator";
import { reactionSchema } from "../utils/reaction.validator";
import { addCommentSchema } from "../utils/comment.validator";
import type { CreateNoteInput } from "../utils/note.validator";
import type { Request, Response } from "express";
import mongoose from "mongoose";


// @desc Create Note
// @route POST /
// @access Private
const createNoteController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const result = createNoteSchema.safeParse(req.body);

    const userId = req.user._id;

    if (!result.success) {
        const errors = result.error.issues.map(i => i.message);
        return res.status(400).json({ message: errors.join(", ") });
    }

    const incomingData = result.data;


    const { showUsername, subject, content, categoryEmoji }: CreateNoteInput = incomingData;

    const note = await Note.create({
        user: userId,
        showUsername,
        subject,
        content,
        categoryEmoji,
    });

    res.status(201).json({
        success: true,
        data: note.toObject(),
    });
});

// @desc Like/Dislike Note
// @route POST /:id/like
// @access Private
const toggleLikeController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const noteIdParam = req.params.id;

    if (typeof noteIdParam !== "string" || !mongoose.Types.ObjectId.isValid(noteIdParam)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const noteId = new mongoose.Types.ObjectId(noteIdParam);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if like already exists inside the transaction
        const existingLike = await Like.findOne({ userId, noteId: noteId }).session(session);

        let liked: boolean;

        if (existingLike) {
            // Already liked → remove like
            await Like.deleteOne({ userId, noteId: noteId }).session(session);
            await Note.updateOne({ _id: noteId }, { $inc: { likes: -1 } }).session(session);
            liked = false;
        } else {
            // Not liked → create like
            await Like.create([{ userId, noteId: noteId }], { session });
            await Note.updateOne({ _id: noteId }, { $inc: { likes: 1 } }).session(session);
            liked = true;
        }

        await session.commitTransaction();

        return res.status(200).json({ success: true, liked });

    } catch (err) {
        if ((err as any).code === 11000) {
            // means like already exists → treat as liked
            return res.status(200).json({
                success: true,
                liked: true
            });
        }
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Reacting Note
// @route POST /:id/reaction
// @access Private
const reactionController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = reactionSchema.safeParse({
        noteId: req.params.id,
        emoji: req.body.emoji,
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues?.[0]?.message || "Invalid input",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { noteId, emoji: reactionEmoji } = parsed.data;

        let response;

        const existing = await Reaction.findOne(
            { user: userId, note: noteId },
            null,
            { session }
        );

        // CASE 1
        if (!existing) {
            await Reaction.create(
                [{ user: userId, note: noteId, emoji: reactionEmoji }],
                { session }
            );

            await Note.updateOne(
                { _id: noteId },
                { $inc: { [`reactionsCount.${reactionEmoji}`]: 1 } },
                { session }
            );

            response = { success: true, reacted: true, emoji: reactionEmoji };
        }

        // CASE 2
        else if (existing.emoji === reactionEmoji) {
            await Reaction.deleteOne(
                { user: userId, note: noteId },
                { session }
            );

            await Note.updateOne(
                { _id: noteId },
                { $inc: { [`reactionsCount.${reactionEmoji}`]: -1 } },
                { session }
            );

            response = { success: true, reacted: false, emoji: null };
        }

        // CASE 3
        else {
            const oldEmoji = existing.emoji;

            await Reaction.updateOne(
                { user: userId, note: noteId },
                { emoji: reactionEmoji },
                { session }
            );

            await Note.updateOne(
                { _id: noteId },
                {
                    $inc: {
                        [`reactionsCount.${oldEmoji}`]: -1,
                        [`reactionsCount.${reactionEmoji}`]: 1,
                    }
                },
                { session }
            );

            response = { success: true, reacted: true, emoji: reactionEmoji };
        }

        await session.commitTransaction();

        return res.json(response);

    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Comment on Note
// @route POST /:id/comment
// @access Private
const addCommentController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = addCommentSchema.safeParse({
        noteId: req.params.id,
        text: req.body.text,
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map(i => i.message).join(", "),
        });
    }

    const { noteId, text } = parsed.data;

    const comment = await Comment.create({
        noteId: new mongoose.Types.ObjectId(noteId),
        user: userId,
        text,
    });

    await Note.updateOne(
        { _id: noteId },
        { $inc: { commentsCount: 1 } }
    );

    res.status(201).json({
        success: true,
        comment,
    });
});

const getMyNotes = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const total = await Note.countDocuments({ user: userId });

    const notes = await Note.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return res.status(200).json({
        success: true,
        count: notes.length,
        total,
        data: notes,
    });
});

export {
    createNoteController, // done
    toggleLikeController, // done
    reactionController, // done
    addCommentController, // done
    getMyNotes, // done
}