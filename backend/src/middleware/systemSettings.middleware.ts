import { Request, Response, NextFunction } from "express";
import SystemSettings from "../models/SystemSettings.model";

// Middleware to block API requests if Maintenance Mode is active
export const checkMaintenanceMode = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await SystemSettings.findOne();
        if (settings && settings.maintenanceMode) {
            return res.status(503).json({
                success: false,
                message: "System is currently under maintenance. Please try again later.",
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to block new signups
export const checkSignupsEnabled = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await SystemSettings.findOne();
        if (settings && settings.disableSignups) {
            return res.status(403).json({
                success: false,
                message: "New user signups are currently disabled by the administrator.",
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};
