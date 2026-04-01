import { Types } from "mongoose";

export interface NoteTypes {
    readonly user: Types.ObjectId;
    showUsername: boolean;
    subject?: string | undefined;
    content: string;
    categoryEmoji: string;
    likes: number;
    reactionsCount: Map<string, number>;
    commentsCount: Number;
}