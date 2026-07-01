import mongoose, { Document, Schema, Model } from "mongoose";

export interface AuditLogDocument extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    targetId: string;
    targetModel: string;
    details: string;
    createdAt: Date;
    updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: "AdminUser",
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ["BAN_USER", "UNBAN_USER", "DELETE_USER", "DELETE_NOTE", "DELETE_COMMENT", "UPDATE_SETTINGS"],
        },
        targetId: {
            type: String,
            required: true,
        },
        targetModel: {
            type: String,
            required: true,
            enum: ["User", "Note", "Comment", "SystemSettings"],
        },
        details: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching recent logs quickly
auditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<AuditLogDocument> = mongoose.models.AuditLog || mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
export default AuditLog;
