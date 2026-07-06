import { asyncHandler } from "../utils/asyncHandler";
import Note from "../models/Note.model";
import Like from "../models/Like.model";
import Reaction from "../models/Reaction.model";
import Comment from "../models/Comment.model";
import SavedNote from "../models/SavedNote.model";
import { createNoteSchema } from "../utils/note.validator";
import { reactionSchema } from "../utils/reaction.validator";
import { addCommentSchema, addReplySchema, editCommentSchema, deleteCommentSchema } from "../utils/comment.validator";
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

    // Guard: verify the note still exists before creating a comment
    const noteExists = await Note.exists({ _id: noteId });
    if (!noteExists) {
        return res.status(404).json({ message: "Note not found or has been deleted" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const comment = await Comment.create([{
            noteId: new mongoose.Types.ObjectId(noteId),
            user: userId,
            text,
        }], { session });

        await Note.updateOne(
            { _id: noteId },
            { $inc: { commentsCount: 1 } },
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            comment: comment[0],
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Reply to a Comment
// @route POST /comments/:commentId/reply
// @access Private
const addReplyController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = addReplySchema.safeParse({
        commentId: req.params.commentId,
        text: req.body.text,
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map(i => i.message).join(", "),
        });
    }

    const { commentId, text } = parsed.data;

    const parentComment = await Comment.findById(commentId);

    if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
    }

    // Enforce single-level nesting: parent must not have a parentCommentId
    if (parentComment.parentCommentId) {
        return res.status(400).json({
            message: "Cannot reply to a reply. Only one level of nesting is allowed.",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const reply = await Comment.create([{
            noteId: parentComment.noteId,
            user: userId,
            text,
            parentCommentId: new mongoose.Types.ObjectId(commentId),
        }], { session });

        // Increment parent comment's replies count
        await Comment.updateOne(
            { _id: commentId },
            { $inc: { repliesCount: 1 } },
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            reply: reply[0],
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
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

// @desc Delete Note
// @route DELETE /:id
// @access Private
const deleteNoteController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const noteIdParam = req.params.id;

    if (typeof noteIdParam !== "string" || !mongoose.Types.ObjectId.isValid(noteIdParam)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const noteId = new mongoose.Types.ObjectId(noteIdParam);

    // Check if note exists and belongs to user
    const note = await Note.findOne({ _id: noteId, user: userId });

    if (!note) {
        return res.status(404).json({ message: "Note not found or unauthorized" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Delete the note
        await Note.deleteOne({ _id: noteId }, { session });

        // Delete related likes
        await Like.deleteMany({ noteId: noteId }, { session });

        // Delete related reactions
        await Reaction.deleteMany({ note: noteId }, { session });

        // Delete related comments (including nested replies since they all have noteId reference)
        await Comment.deleteMany({ noteId: noteId }, { session });

        // Delete any bookmarks pointing to this note
        await SavedNote.deleteMany({ note: noteId }, { session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Note deleted successfully"
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Edit a Comment
// @route PUT /comments/:commentId
// @access Private
const editCommentController = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = editCommentSchema.safeParse({
        commentId: req.params.commentId,
        text: req.body.text,
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map(i => i.message).join(", "),
        });
    }

    const { commentId, text } = parsed.data;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Forbidden: You can only edit your own comments" });
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { text }, { new: true });

    res.status(200).json({
        success: true,
        comment: updatedComment,
    });
});

// @desc Delete a Comment
// @route DELETE /comments/:commentId
// @access Private
const deleteCommentController = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = deleteCommentSchema.safeParse({
        commentId: req.params.commentId
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues?.[0]?.message || "Invalid comment id"
        });
    }

    const { commentId } = parsed.data;

    // Find the comment to get its details
    const comment = await Comment.findById(commentId);
    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own comments" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // CASE 1: Deleting a top-level parent comment
        if (!comment.parentCommentId) {

            // Delete all nested replies linked to this parent comment
            await Comment.deleteMany(
                { parentCommentId: comment._id },
                { session }
            );

            // Since it's a top-level comment, decrement the note's commentsCount by exactly 1
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

        // Delete the comment
        await Comment.deleteOne({ _id: comment._id }, { session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Toggle Save (Bookmark) a Note
// @route POST /:id/save
// @access Private
const toggleSaveController = asyncHandler(async (req: Request, res: Response) => {
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
        const existing = await SavedNote.findOne({ user: userId, note: noteId }).session(session);

        let saved: boolean;

        if (existing) {
            await SavedNote.deleteOne({ user: userId, note: noteId }).session(session);
            await Note.updateOne({ _id: noteId }, { $inc: { savesCount: -1 } }).session(session);
            saved = false;
        } else {
            await SavedNote.create([{ user: userId, note: noteId }], { session });
            await Note.updateOne({ _id: noteId }, { $inc: { savesCount: 1 } }).session(session);
            saved = true;
        }

        await session.commitTransaction();

        return res.status(200).json({ success: true, saved });

    } catch (err) {
        if ((err as any).code === 11000) {
            // Concurrent save — treat as already saved
            return res.status(200).json({ success: true, saved: true });
        }
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});

// @desc Get all saved notes for the current user
// @route GET /saved
// @access Private
const getSavedNotesController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const total = await SavedNote.countDocuments({ user: userId });

    const savedNotes = await SavedNote.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("note")
        .lean();

    return res.status(200).json({
        success: true,
        count: savedNotes.length,
        total,
        data: savedNotes.map(s => s.note),
    });
});

export {
    createNoteController,
    toggleLikeController,
    reactionController,
    addCommentController,
    addReplyController,
    getMyNotes,
    deleteNoteController,
    editCommentController,
    deleteCommentController,
    toggleSaveController,
    getSavedNotesController,
};