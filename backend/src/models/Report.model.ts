import mongoose, { Schema, Types } from "mongoose";

export interface ReportTypes {
    user: Types.ObjectId;
    note: Types.ObjectId;
    reason: string;
    details?: string;
}

const reportSchema = new Schema<ReportTypes>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        index: true,
    },
    reason: {
        type: String,
        required: true,
        enum: ["spam", "harassment", "inappropriate", "other"],
    },
    details: {
        type: String,
        trim: true,
        maxlength: 1000,
    }
}, {
    timestamps: true,
});

reportSchema.index({ user: 1, note: 1 }, { unique: true });

const Report = mongoose.model<ReportTypes>("Report", reportSchema);

export default Report;
