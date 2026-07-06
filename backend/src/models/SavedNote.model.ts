import mongoose, { Schema } from "mongoose";
import type { SavedNoteTypes } from "../types/savedNote.types";

const savedNoteSchema = new Schema<SavedNoteTypes>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        note: {
            type: Schema.Types.ObjectId,
            ref: "Note",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate saves and allow fast lookup per-user
savedNoteSchema.index({ user: 1, note: 1 }, { unique: true });

const SavedNote = mongoose.model<SavedNoteTypes>("SavedNote", savedNoteSchema);

export default SavedNote;
