import { z } from "zod";

export const emojiSchema = z.object({
    emoji: z.enum(["😠", "😊", "🔥", "💡"])
});

export type EmojiInput = z.infer<typeof emojiSchema>;