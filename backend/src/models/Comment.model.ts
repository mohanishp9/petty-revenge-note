import mongoose, { Schema } from "mongoose";
import type { CommentTypes } from "../types/comment.types";

const commentSchema = new Schema<CommentTypes>(
    {
        noteId: {
            type: Schema.Types.ObjectId,
            ref: "Note",
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
    },
    {
        timestamps: true,
    }
);

// for fast pagination
commentSchema.index({ noteId: 1, createdAt: -1 });

const Comment = mongoose.model<CommentTypes>("Comment", commentSchema);

export default Comment;