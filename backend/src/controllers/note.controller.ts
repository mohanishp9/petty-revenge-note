import { asyncHandler } from "../utils/asyncHandler.js";
import Note from "../models/Note.model.js";
import Reaction from "../models/Reaction.model.js";
import Like from "../models/Like.model.js";
import type { SortOrder } from "mongoose";
import { emojiSchema } from "../utils/note.validator.js";
import type { EmojiInput } from "../utils/note.validator.js";
import type { Request, Response } from "express";

// @desc Get all notes also sort
// @route GET /?sort=mostLiked&page=1&limit=10
// @access Public
const getNotesController = asyncHandler(async (req: Request, res: Response) => {
    const sort = req.query.sort as string;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    let sortOption: Record<string, SortOrder> = { createdAt: -1 };

    if (sort === "mostLiked") {
        sortOption = { likes: -1 };
    } else if (sort === "oldest") {
        sortOption = { createdAt: 1 };
    }

    const notes = await Note.find()
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    res.status(200).json({
        success: true,
        count: notes.length,
        data: notes
    });
});



// @desc Get top 5 notes by emoji
// @route GET /top5/:emoji
// @access Public
const getTopFiveNotesByEmojiController = asyncHandler(async (req: Request, res: Response) => {
    const { emoji } = emojiSchema.parse(req.params);

    const notes = await Reaction.aggregate([
        { $match: { emoji } },
        {
            $group: {
                _id: "$note",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
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
    })
});

export {
    getNotesController,
    getTopFiveNotesByEmojiController,
}