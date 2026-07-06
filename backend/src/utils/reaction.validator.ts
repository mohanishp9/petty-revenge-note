import { z } from "zod";
import mongoose from "mongoose";
import { VALID_EMOJIS } from "./constants";

export const reactionSchema = z.object({
    noteId: z.string().refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        { message: "Invalid note id" }
    ),
    emoji: z.enum(VALID_EMOJIS),
});
