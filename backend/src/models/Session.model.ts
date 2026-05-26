import mongoose from "mongoose";
import type { Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import type { ISession, ISessionMethods, SessionModel } from "../types/session.types";

const { Schema } = mongoose;

const sessionSchema = new Schema<ISession, SessionModel, ISessionMethods>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        refreshTokenHash: {
            type: String,
            required: true,
        },
        ip: {
            type: String,
            required: false,
        },
        userAgent: {
            type: String,
            required: false,
        },
        revoked: {
            type: Boolean,
            default: false,
            index: true,
        },
        rotatedAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient session lookups
sessionSchema.index({ userId: 1, revoked: 1 });

// Pre-save hook to hash refresh token if modified
sessionSchema.pre<HydratedDocument<ISession>>("save", async function () {
    // Only hash the refreshTokenHash if it's being set for the first time
    // Note: The refreshTokenHash field should receive the PLAIN token, and we hash it here
    if (this.isModified("refreshTokenHash") && !this.refreshTokenHash.startsWith("$2")) {
        // Only hash if it doesn't look like a bcrypt hash already
        const salt = await bcrypt.genSalt(12);
        this.refreshTokenHash = await bcrypt.hash(this.refreshTokenHash, salt);
    }
});

// Method to compare refresh token
sessionSchema.methods.compareRefreshToken = async function (
    candidateToken: string
): Promise<boolean> {
    return await bcrypt.compare(candidateToken, this.refreshTokenHash);
};

const Session = mongoose.model<ISession, SessionModel>("Session", sessionSchema);

export default Session;
