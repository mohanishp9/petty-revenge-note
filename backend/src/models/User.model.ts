import mongoose from "mongoose";
import type { Model, HydratedDocument } from "mongoose";
import type { IUser } from "../types/user.types.js";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
},
    {
        timestamps: true
    });

// pre-save hook

userSchema.pre<HydratedDocument<IUser>>("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;