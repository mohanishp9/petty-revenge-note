import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import Note from "../../models/Note.model";
import Comment from "../../models/Comment.model";
import Like from "../../models/Like.model";
import Reaction from "../../models/Reaction.model";
import AuditLog from "../../models/AuditLog.model";

// @desc Get all notes for moderation
// @route GET /api/admin/notes
// @access Private (Admin)
export const getAllNotesAdmin = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const sort = req.query.sort as string || "-createdAt";

    const query: any = {};
    if (search) {
        query.$or = [
            { subject: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
        ];
    }

    const total = await Note.countDocuments(query);
    
    // We use .lean() for faster execution because these are read-only
    const notes = await Note.find(query)
        .populate("user", "username email")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return res.status(200).json({
        success: true,
        notes,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

// @desc Hard delete a note and cascade delete everything attached
// @route DELETE /api/admin/notes/:id
// @access Private (Admin)
export const deleteNoteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const noteId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const note = await Note.findById(noteId).session(session);
        if (!note) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        // 1. Get comment IDs on this note to cascade-delete their reactions
        const commentIds = await Comment.distinct("_id", { noteId: noteId }).session(session);
        
        // 2. Delete all comments on this note (field is noteId, not note)
        await Comment.deleteMany({ noteId: noteId }).session(session);

        // 3. Delete all reactions on the comments of this note
        if (commentIds.length > 0) {
            await Reaction.deleteMany({ comment: { $in: commentIds } }).session(session);
        }

        // 4. Delete all likes on this note (field is noteId, not note)
        await Like.deleteMany({ noteId: noteId }).session(session);

        // 5. Delete the actual note
        await Note.findByIdAndDelete(noteId).session(session);

        // 6. Create Audit Log
        await AuditLog.create([{
            adminId: req.adminUser!._id,
            action: "DELETE_NOTE",
            targetId: noteId as string,
            targetModel: "Note",
            details: `Admin ${req.adminUser!.name} purged note "${note.subject}"`,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Note and all associated comments and reactions permanently deleted",
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
