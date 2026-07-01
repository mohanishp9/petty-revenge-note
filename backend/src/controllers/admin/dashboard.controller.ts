import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import User from "../../models/User.model";
import Note from "../../models/Note.model";
import Comment from "../../models/Comment.model";
import Reaction from "../../models/Reaction.model";

// @desc Get high-level stats for the admin dashboard
// @route GET /api/admin/dashboard/stats
// @access Private (Admin)
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    // Calculate 30 days ago date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const matchStage = { $match: { createdAt: { $gte: thirtyDaysAgo } } };
    const groupStage = {
        $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }
    };

    const [totalUsers, totalNotes, totalComments, totalReactions, usersByDay, notesByDay, commentsByDay] = await Promise.all([
        User.countDocuments(),
        Note.countDocuments(),
        Comment.countDocuments(),
        Reaction.countDocuments(),
        User.aggregate([matchStage, groupStage]),
        Note.aggregate([matchStage, groupStage]),
        Comment.aggregate([matchStage, groupStage]),
    ]);

    // Build array of last 30 days to ensure there are no gaps
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const u = usersByDay.find((x: any) => x._id === dateStr);
        const n = notesByDay.find((x: any) => x._id === dateStr);
        const c = commentsByDay.find((x: any) => x._id === dateStr);
        
        chartData.push({
            date: dateStr,
            users: u ? u.count : 0,
            notes: n ? n.count : 0,
            comments: c ? c.count : 0,
        });
    }

    return res.status(200).json({
        success: true,
        stats: {
            users: totalUsers,
            notes: totalNotes,
            comments: totalComments,
            reactions: totalReactions,
        },
        chartData
    });
});
