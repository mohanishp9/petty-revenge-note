import { z } from "zod";

export const emojiSchema = z.object({
    emoji: z.enum(["😂", "😡", "😳", "😭"])
});

export type EmojiInput = z.infer<typeof emojiSchema>;

export const createNoteSchema = z.object({
    showUsername: z.boolean().optional().default(true),
    subject: z
        .string()
        .max(100, { message: "Subject cannot exceed 100 characters" })
        .optional(),

    content: z
        .string()
        .min(1, { message: "Content is required" })
        .max(500, { message: "Content cannot exceed 500 characters" }),

    categoryEmoji: z.enum(["😂", "😡", "😳", "😭"]),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const noteQuerySchema = z.object({
    sort: z.enum(["mostLiked", "oldest"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
});

