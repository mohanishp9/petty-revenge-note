import mongoose, { Schema } from "mongoose";
import type { LikeTypes } from "../types/like.types";

const likeSchema = new Schema<LikeTypes>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    noteId: {
        type: Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        index: true,
    }
}, { timestamps: true });

likeSchema.index({ userId: 1, noteId: 1 }, { unique: true });

const Like = mongoose.model<LikeTypes>("Like", likeSchema);

export default Like;