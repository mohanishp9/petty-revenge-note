import { Types } from "mongoose";

export interface LikeTypes {
    readonly userId: Types.ObjectId;
    readonly noteId: Types.ObjectId;
}