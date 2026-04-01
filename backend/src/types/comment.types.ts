import { Types } from "mongoose";

export interface CommentTypes {
    _id?: Types.ObjectId;
    noteId: Types.ObjectId;
    user: Types.ObjectId;
    text: string;
    createdAt?: Date;
    updatedAt?: Date;
}