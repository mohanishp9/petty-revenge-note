import mongoose, {Schema} from "mongoose";
import type { NoteTypes } from "../types/note.types.js";

const noteSchema = new Schema<NoteTypes>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    showUsername: {
        type: Boolean,
        required: true,
        default: true
    },
    subject: {
        type: String,
        trim: true,
        maxLength: 100,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500,
    },
    categoryEmoji: {
        type: String,
        required: true,
        enum: ["😠", "😊", "🔥", "💡"], // change later
        default: "😠",
    },
    likes: { type: Number, default: 0 },
    reactionsCount: {
        type: Map,
        of: Number,
        default: {}
    },
    comments: [{
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        createdAt: { type: Date, default: Date.now },
    }],
}, {
    timestamps: true,
});

noteSchema.index({ createdAt: -1 });
noteSchema.index({ likes: -1 });

const Note = mongoose.model<NoteTypes>("Note", noteSchema);

export default Note;
