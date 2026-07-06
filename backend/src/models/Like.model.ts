import mongoose, { Schema } from "mongoose";
import type { LikeTypes } from "../types/like.types";

const likeSchema = new Schema<LikeTypes>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        index: true,
    }
}, { timestamps: true });

likeSchema.index({ user: 1, note: 1 }, { unique: true });

const Like = mongoose.model<LikeTypes>("Like", likeSchema);

export default Like;