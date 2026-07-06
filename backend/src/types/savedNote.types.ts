import { Types } from "mongoose";

export interface SavedNoteTypes {
    readonly user: Types.ObjectId;
    readonly note: Types.ObjectId;
}
