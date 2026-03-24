import {Types} from "mongoose";

export interface IUser {
    readonly _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
}