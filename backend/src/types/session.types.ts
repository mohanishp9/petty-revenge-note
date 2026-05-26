import { Types } from "mongoose";

export interface ISession {
    readonly _id: Types.ObjectId;
    userId: Types.ObjectId;
    refreshTokenHash: string;
    ip?: string;
    userAgent?: string;
    revoked: boolean;
    rotatedAt?: Date; // For grace period during rotation
    createdAt: Date;
    updatedAt: Date;
}

export interface ISessionMethods {
    compareRefreshToken(candidateToken: string): Promise<boolean>;
}

export type SessionModel = import("mongoose").Model<ISession, {}, ISessionMethods>;

export interface TokenPayload {
    userId: string;
    sessionId: string;
    tokenFamily?: string; // Random string for rotation verification
    iat: number;
    exp: number;
    type: "access" | "refresh";
}
