import { Types } from "mongoose";

export interface ReactionTypes {
    user: Types.ObjectId;
    note: Types.ObjectId;
    emoji: string;
}