import { z } from "zod";
import mongoose from "mongoose";

export const addCommentSchema = z.object({
    noteId: z.string().refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        { message: "Invalid note id" }
    ),
    text: z.string().trim().min(1, "Text cannot be empty").max(300, "Comment too long"),
});

export const addReplySchema = z.object({
    commentId: z.string().refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        { message: "Invalid comment id" }
    ),
    text: z.string().trim().min(1, "Text cannot be empty").max(300, "Reply too long"),
});