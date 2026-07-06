import { Types } from "mongoose";

export interface LikeTypes {
    readonly user: Types.ObjectId;
    readonly note: Types.ObjectId;
}