import mongoose, { Schema } from "mongoose";
import type { ReactionTypes } from "../types/reaction.types";
import { VALID_EMOJIS } from "../utils/constants";

const reactionSchema = new Schema<ReactionTypes>({
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
    emoji: {
        type: String,
        enum: VALID_EMOJIS,
        default: VALID_EMOJIS[0],
        required: true,
    }
}, { timestamps: true });


// Prevent duplicate reaction per user per emoji
reactionSchema.index({ user: 1, note: 1 }, { unique: true });

reactionSchema.index({ emoji: 1, note: 1 });

const Reaction = mongoose.model<ReactionTypes>("Reaction", reactionSchema);

export default Reaction;