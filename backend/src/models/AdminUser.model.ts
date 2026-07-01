import mongoose from "mongoose";
import type { Model, HydratedDocument } from "mongoose";
import type { IAdminUser } from "../types/adminUser.types";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

interface IAdminUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

type AdminUserModel = Model<IAdminUser, {}, IAdminUserMethods>

const adminUserSchema = new Schema<IAdminUser, AdminUserModel, IAdminUserMethods>({
    name: {
        type: String,
        required: true,
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
    isSuperAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// pre-save hook
adminUserSchema.pre<HydratedDocument<IAdminUser>>("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password as string, 10);
});

adminUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password as string);
};

const AdminUser = mongoose.model<IAdminUser, AdminUserModel>("AdminUser", adminUserSchema);

export default AdminUser;
