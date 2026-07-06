export const VALID_EMOJIS = ["😂", "😡", "😳", "😭"] as const;
export type ValidEmoji = typeof VALID_EMOJIS[number];
