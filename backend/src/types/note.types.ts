import { Types } from "mongoose";

export interface NoteTypes {
    readonly user: Types.ObjectId;
    showUsername: boolean;
    subject?: string;
    content: string;
    categoryEmoji: string;
    likes: number;
    reactionsCount: Map<string, number>;
    comments: {
        readonly user: Types.ObjectId;
        text: string;
        createdAt: Date;
    }[];
}