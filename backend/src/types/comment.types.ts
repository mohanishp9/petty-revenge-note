import { Types } from "mongoose";

export interface CommentTypes {
    _id?: Types.ObjectId;
    noteId: Types.ObjectId;
    user: Types.ObjectId;
    text: string;
    parentCommentId?: Types.ObjectId | null;
    repliesCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}