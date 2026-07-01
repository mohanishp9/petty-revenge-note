import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import SystemSettings from "../../models/SystemSettings.model";
import AuditLog from "../../models/AuditLog.model";

// Helper to ensure settings exist
const getOrCreateSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = await SystemSettings.create({
            maintenanceMode: false,
            disableSignups: false
        });
    }
    return settings;
};

// @desc Get global system settings
// @route GET /api/admin/settings
// @access Private (Admin)
export const getSystemSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, settings });
});

// @desc Update global system settings
// @route PUT /api/admin/settings
// @access Private (Admin)
export const updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await getOrCreateSettings();
    const { maintenanceMode, disableSignups } = req.body;
    
    let actionDetails = "";
    
    if (typeof maintenanceMode === "boolean" && settings.maintenanceMode !== maintenanceMode) {
        settings.maintenanceMode = maintenanceMode;
        actionDetails += maintenanceMode ? "Enabled Maintenance Mode. " : "Disabled Maintenance Mode. ";
    }
    
    if (typeof disableSignups === "boolean" && settings.disableSignups !== disableSignups) {
        settings.disableSignups = disableSignups;
        actionDetails += disableSignups ? "Disabled New Signups. " : "Enabled New Signups. ";
    }
    
    if (actionDetails) {
        await settings.save();
        
        await AuditLog.create({
            adminId: req.adminUser!._id,
            action: "UPDATE_SETTINGS",
            targetId: settings._id.toString(),
            targetModel: "SystemSettings",
            details: `Admin ${req.adminUser!.name} updated system controls: ${actionDetails.trim()}`,
        });
    }

    return res.status(200).json({ success: true, settings });
});
