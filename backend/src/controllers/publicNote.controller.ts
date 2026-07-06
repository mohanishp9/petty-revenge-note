import { asyncHandler } from "../utils/asyncHandler";
import Note from "../models/Note.model";
import User from "../models/User.model";
import Reaction from "../models/Reaction.model";
import Comment from "../models/Comment.model";
import mongoose, { type SortOrder } from "mongoose";
import { emojiSchema, noteQuerySchema, createNoteSchema } from "../utils/note.validator";
import type { Request, Response } from "express";
import Like from "../models/Like.model";
import SavedNote from "../models/SavedNote.model";

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
                isSaved: false,
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

    const savedNotes = await SavedNote.find({
        user: userId,
        note: { $in: noteIds }
    }).lean();

    const savedSet = new Set(savedNotes.map(s => s.note.toString()));

    const enrichedNotes = notes.map(note => ({
        ...note,
        hasLiked: likedSet.has(note._id.toString()),
        isSaved: savedSet.has(note._id.toString()),
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

    const userId = req.user?._id;
    let enrichedData = notes;

    if (userId && notes.length > 0) {
        const noteIds = notes.map(n => n.note._id);

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

        const savedNotes = await SavedNote.find({
            user: userId,
            note: { $in: noteIds }
        }).lean();
        const savedSet = new Set(savedNotes.map(s => s.note.toString()));

        enrichedData = notes.map(item => ({
            count: item.count,
            note: {
                ...item.note,
                hasLiked: likedSet.has(item.note._id.toString()),
                isSaved: savedSet.has(item.note._id.toString()),
                userReaction: reactionMap.get(item.note._id.toString()) || null
            }
        }));
    } else {
        enrichedData = notes.map(item => ({
            count: item.count,
            note: {
                ...item.note,
                hasLiked: false,
                isSaved: false,
                userReaction: null
            }
        }));
    }

    res.status(200).json({
        success: true,
        count: notes.length,
        data: enrichedData,
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

    // Get top-level comments only (no parentCommentId)
    const comments = await Comment.find({ noteId, parentCommentId: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Get replies for each comment
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({
        noteId,
        parentCommentId: { $in: commentIds }
    })
        .sort({ createdAt: 1 })
        .lean();

    // Group replies by parent comment
    const repliesMap = new Map<string, any[]>();
    for (const reply of replies) {
        const parentId = reply.parentCommentId?.toString();
        if (parentId) {
            if (!repliesMap.has(parentId)) {
                repliesMap.set(parentId, []);
            }
            repliesMap.get(parentId)!.push(reply);
        }
    }

    // Attach replies to comments
    const commentsWithReplies = comments.map(comment => ({
        ...comment,
        replies: repliesMap.get(comment._id.toString()) || [],
    }));

    const total = await Comment.countDocuments({ noteId, parentCommentId: null });

    res.status(200).json({
        success: true,
        count: comments.length,
        total,
        hasMore: page * limit < total,
        comments: commentsWithReplies,
    });
});

// @desc Search notes
// @route GET /search?q=query&page=1&limit=10
// @access Public
const searchNotesController = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
    }

    const searchStr = q.trim();
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
        {
            $search: {
                index: "note-search", // Must match Atlas index name
                compound: {
                    should: [
                        {
                            text: {
                                query: searchStr,
                                path: "subject",
                                score: { boost: { value: 5 } },
                                fuzzy: { maxEdits: 1 }
                            }
                        },
                        {
                            text: {
                                query: searchStr,
                                path: "content",
                                score: { boost: { value: 1 } },
                                fuzzy: { maxEdits: 2 }
                            }
                        }
                    ]
                },
                highlight: { path: ["subject", "content"] }
            }
        },
        {
            $addFields: {
                score: { $meta: "searchScore" },
                highlights: { $meta: "searchHighlights" }
            }
        }
    ];

    // For total count without paginating
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Note.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination and lookup to the main pipeline
    pipeline.push(
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDoc"
            }
        },
        {
            $unwind: {
                path: "$userDoc",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                user: {
                    _id: "$userDoc._id",
                    username: "$userDoc.username"
                }
            }
        },
        {
            $project: {
                userDoc: 0
            }
        }
    );

    const notes = await Note.aggregate(pipeline);

    const userId = req.user?._id;
    let enrichedNotes = notes;

    if (userId && notes.length > 0) {
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

        const savedNotes = await SavedNote.find({
            user: userId,
            note: { $in: noteIds }
        }).lean();
        const savedSet = new Set(savedNotes.map(s => s.note.toString()));

        enrichedNotes = notes.map(note => ({
            ...note,
            hasLiked: likedSet.has(note._id.toString()),
            isSaved: savedSet.has(note._id.toString()),
            userReaction: reactionMap.get(note._id.toString()) || null
        }));
    } else {
        enrichedNotes = notes.map(note => ({
            ...note,
            hasLiked: false,
            isSaved: false,
            userReaction: null
        }));
    }

    res.status(200).json({
        success: true,
        count: enrichedNotes.length,
        total,
        data: enrichedNotes,
    });
});

// @desc Increment Share Count
// @route POST /api/public/notes/:id/share
// @access Public
const incrementShareController = asyncHandler(async (req: Request, res: Response) => {
    const noteId = req.params.id;
    if (typeof noteId !== "string" || !mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const note = await Note.findOneAndUpdate(
        { _id: noteId },
        { $inc: { sharesCount: 1 } },
        { new: true }
    );

    if (!note) {
        return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ success: true, sharesCount: note.sharesCount });
});

// @desc Get a single note by ID
// @route GET /api/public/notes/:id
// @access Public (with optionalAuth)
const getSingleNoteController = asyncHandler(async (req: Request, res: Response) => {
    const noteId = req.params.id;
    if (typeof noteId !== "string" || !mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: "Invalid note id" });
    }

    const note = await Note.findById(noteId).populate("user", "username").lean();
    if (!note) {
        return res.status(404).json({ message: "Note not found" });
    }

    const userId = req.user?._id;
    let hasLiked = false;
    let isSaved = false;
    let userReaction = null;

    if (userId) {
        const like = await Like.findOne({ userId, noteId }).lean();
        if (like) hasLiked = true;

        const reaction = await Reaction.findOne({ user: userId, note: noteId }).lean();
        if (reaction) userReaction = reaction.emoji;

        const savedNote = await SavedNote.findOne({ user: userId, note: noteId }).lean();
        if (savedNote) isSaved = true;
    }

    const enrichedNote = {
        ...note,
        hasLiked,
        isSaved,
        userReaction,
    };

    res.status(200).json({
        success: true,
        data: enrichedNote,
    });
});

export {
    getNotesController, // done
    getTopNotesByEmojiController,
    getCommentsController, // done
    searchNotesController, // new
    incrementShareController,
    getSingleNoteController,
}