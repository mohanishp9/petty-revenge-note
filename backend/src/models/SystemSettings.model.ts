import mongoose, { Document, Schema, Model } from "mongoose";

export interface SystemSettingsDocument extends Document {
    maintenanceMode: boolean;
    disableSignups: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const systemSettingsSchema = new Schema<SystemSettingsDocument>(
    {
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        disableSignups: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const SystemSettings: Model<SystemSettingsDocument> = mongoose.models.SystemSettings || mongoose.model<SystemSettingsDocument>("SystemSettings", systemSettingsSchema);
export default SystemSettings;
