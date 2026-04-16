import { asyncHandler } from "../utils/asyncHandler";
import Note from "../models/Note.model";
import User from "../models/User.model";
import Reaction from "../models/Reaction.model";
import Comment from "../models/Comment.model";
import mongoose, { type SortOrder } from "mongoose";
import { emojiSchema, noteQuerySchema, createNoteSchema } from "../utils/note.validator";
import type { Request, Response } from "express";
import Like from "../models/Like.model";

// @desc Get all notes also sort
// @route GET /?sort=mostLiked&page=1&limit=10
// @access Public
const getNotesController = asyncHandler(async (req: Request, res: Response) => {
    const { sort, page, limit } = noteQuerySchema.parse(req.query);
    const sortQuery = sort as string;

    const pageQuery = Number(page) || 1;
    const limitQuery = Number(limit) || 12;

    let sortOption: Record<string, SortOrder> = { createdAt: -1 };

    if (sortQuery === "mostLiked") {
        sortOption = { likes: -1 };
    } else if (sortQuery === "oldest") {
        sortOption = { createdAt: 1 };
    }

    const notes = await Note.find()
        .populate("user", "username")
        .select("-comments")
        .sort(sortOption)
        .skip((pageQuery - 1) * limitQuery)
        .limit(limitQuery)
        .lean();

    const userId = req.user?._id;

    if (!userId) {
        return res.status(200).json({
            success: true,
            count: notes.length,
            data: notes.map(note => ({
                ...note,
                hasLiked: false,
                userReaction: null
            }))
        });
    }

    const noteIds = notes.map(n => n._id);

    const likes = await Like.find({
        userId,
        noteId: { $in: noteIds },
    }).lean();

    const likedSet = new Set(likes.map(l => l.noteId.toString()));

    const reactions = await Reaction.find({
        user: userId,
        note: { $in: noteIds }
    }).lean();

    const reactionMap = new Map(
        reactions.map(r => [r.note.toString(), r.emoji])
    );

    const enrichedNotes = notes.map(note => ({
        ...note,
        hasLiked: likedSet.has(note._id.toString()),
        userReaction: reactionMap.get(note._id.toString()) || null
    }));

    res.status(200).json({
        success: true,
        count: notes.length,
        data: enrichedNotes,
    });
});



// @desc Get top 5 notes by emoji
// @route GET /top5/:emoji
// @access Public
const getTopNotesByEmojiController = asyncHandler(async (req: Request, res: Response) => {
    const { emoji } = emojiSchema.parse(req.query);

    const notes = await Reaction.aggregate([
        { $match: { emoji } },
        {
            $group: {
                _id: "$note",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        // { $limit: 5 },
        {
            $lookup: {
                from: "notes",
                localField: "_id",
                foreignField: "_id",
                as: "note"
            }
        },
        { $unwind: "$note" },
        {
            $project: {
                _id: 0,
                count: 1,
                note: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: notes.length,
        data: notes,
    });
});

// @desc Comment on Note
// @route GET /:id/comments
// @access Public
const getCommentsController = asyncHandler(async (req: Request, res: Response) => {
    const noteIdParam = req.params.id;

    if (typeof noteIdParam !== "string" || !mongoose.Types.ObjectId.isValid(noteIdParam)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const noteId = new mongoose.Types.ObjectId(noteIdParam);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const comments = await Comment.find({ noteId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Comment.countDocuments({ noteId });

    res.status(200).json({
        success: true,
        count: comments.length,
        total,
        hasMore: page * limit < total,
        comments,
    });
});

export {
    getNotesController, // done
    getTopNotesByEmojiController,
    getCommentsController, // done
}