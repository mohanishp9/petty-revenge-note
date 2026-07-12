import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose, { Types } from 'mongoose';
import User from '../models/User.model';
import Note from '../models/Note.model';
import Comment from '../models/Comment.model';
import Like from '../models/Like.model';
import Reaction from '../models/Reaction.model';
import redisClient from '../config/redis';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otpUtils';
import { sendOtpEmail } from '../services/emailService';

export const checkUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.query;
    const userId = req.user?._id;

    if (!username || typeof username !== 'string') {
        res.status(400);
        throw new Error('Username is required');
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
        res.status(400);
        throw new Error('Username cannot be empty');
    }

    // Exclude the current user so they can "keep" their own username
    const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
        _id: { $ne: userId }
    });

    res.status(200).json({
        success: true,
        available: !existingUser
    });
});

export const updateUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        res.status(400);
        throw new Error('Valid username is required');
    }

    const trimmedUsername = username.trim();

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: trimmedUsername },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404);
            throw new Error('User not found');
        }

        res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'Username updated successfully'
        });
    } catch (error: any) {
        // Catch MongoDB duplicate key error specifically for race conditions
        if (error.code === 11000) {
            res.status(409);
            throw new Error('Username is already taken');
        }
        throw error;
    }
});

export const initiateEmailUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { newEmail, password } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!newEmail || typeof newEmail !== 'string') {
        res.status(400);
        throw new Error('New email is required');
    }

    if (!password) {
        res.status(400);
        throw new Error('Current password is required');
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Verify current password
    const user = await User.findById(userId).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect password');
    }

    if (normalizedEmail === user.email) {
        res.status(400);
        throw new Error('New email must be different from your current email');
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        res.status(409);
        throw new Error('Email is already in use by another account');
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    // Save to Redis (10 minutes expiry)
    const redisKey = `auth:email_update:${userId}`;
    const payload = {
        otpHash,
        attempts: 0,
        newEmail: normalizedEmail
    };

    await redisClient.set(redisKey, JSON.stringify(payload), 'EX', 600);

    // Send email to the NEW address
    await sendOtpEmail(normalizedEmail, otp, 'EMAIL_CHANGE');

    res.status(200).json({
        success: true,
        message: 'OTP sent to new email address',
        email: normalizedEmail
    });
});

export const verifyEmailUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { otp } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!otp || typeof otp !== 'string') {
        res.status(400);
        throw new Error('OTP is required');
    }

    const redisKey = `auth:email_update:${userId}`;
    const rawPayload = await redisClient.get(redisKey);

    if (!rawPayload) {
        res.status(400);
        throw new Error('OTP expired or not found. Please initiate email change again.');
    }

    const payload = JSON.parse(rawPayload);

    if (payload.attempts >= 3) {
        await redisClient.del(redisKey);
        res.status(429);
        throw new Error('Maximum attempts exceeded. Please start over.');
    }

    const isOtpValid = await verifyOtp(otp, payload.otpHash);

    if (!isOtpValid) {
        payload.attempts += 1;
        const remainingTtl = await redisClient.ttl(redisKey);
        await redisClient.set(redisKey, JSON.stringify(payload), 'EX', remainingTtl);
        
        res.status(400);
        throw new Error(`Invalid OTP. ${3 - payload.attempts} attempts remaining.`);
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { email: payload.newEmail },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404);
            throw new Error('User not found');
        }

        // Clean up Redis
        await redisClient.del(redisKey);

        res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'Email updated successfully'
        });
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(409);
            throw new Error('Email is already taken by another account');
        }
        throw error;
    }
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide both current and new passwords');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters long');
    }

    if (currentPassword === newPassword) {
        res.status(400);
        throw new Error('New password must be different from current password');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password');
    }

    // Set new password and save (mongoose pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    });
});

// ────────────────────────────────────────────────────────────
// Account Deletion
// ────────────────────────────────────────────────────────────

const DELETE_REDIS_KEY = (userId: string) => `auth:delete:${userId}`;

/**
 * STEP 1 — Initiate account deletion.
 * Verifies the user's password first (guards against session hijacking),
 * then generates an OTP and sends a confirmation email.
 *
 * @route  POST /api/users/profile/delete/initiate
 * @access Protected
 */
export const deleteAccountInitiate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
        res.status(400);
        throw new Error('Current password is required');
    }

    // Load user with password (select: false by default)
    const user = await User.findById(userId).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect password');
    }

    // Generate OTP, store single JSON payload (atomic WATCH/EXEC pattern on confirm)
    const plainOtp = generateOtp();
    const otpHash = await hashOtp(plainOtp);
    const payload = { otpHash, attempts: 3 };

    await redisClient.set(DELETE_REDIS_KEY(String(userId)), JSON.stringify(payload), 'EX', 600);
    await sendOtpEmail(user.email, plainOtp, 'DELETE_ACCOUNT');

    res.status(200).json({
        success: true,
        message: 'A confirmation OTP has been sent to your email.',
    });
});

/**
 * STEP 2 — Confirm account deletion.
 * Atomically verifies the OTP (WATCH/MULTI/EXEC), then cascades through
 * all collections to erase every trace of the user without corrupting counters.
 *
 * Erasure order (dependencies must be cleared before parent documents):
 *   1. User's own notes  → delete their likes, reactions, comments (all users), then notes
 *   2. User's interactions on others' notes → adjust counters, then delete records
 *   3. User's comments on others' notes → adjust note counters, parent repliesCount, then delete
 *   4. Invalidate refresh token and Redis keys
 *   5. Delete the User document
 *
 * @route  POST /api/users/profile/delete/confirm
 * @access Protected
 */
export const deleteAccountConfirm = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const { otp } = req.body;
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
        res.status(400);
        throw new Error('A valid 6-digit OTP is required');
    }

    const key = DELETE_REDIS_KEY(String(userId));

    // ── Atomic OTP verification (WATCH / MULTI / EXEC) ──────────────────────
    await redisClient.watch(key);
    const raw = await redisClient.get(key);

    if (!raw) {
        await redisClient.unwatch();
        res.status(400);
        throw new Error('OTP expired or not found. Please initiate deletion again.');
    }

    const data = JSON.parse(raw) as { otpHash: string; attempts: number };

    if (data.attempts <= 0) {
        await redisClient.unwatch();
        await redisClient.del(key);
        res.status(400);
        throw new Error('Maximum OTP attempts exceeded. Please initiate deletion again.');
    }

    // Decrement attempts and commit atomically — blocks concurrent requests
    data.attempts -= 1;
    const multi = redisClient.multi();
    multi.set(key, JSON.stringify(data), 'KEEPTTL');
    const execResult = await multi.exec();

    if (!execResult) {
        // WATCH was invalidated — another concurrent request modified the key
        res.status(409);
        throw new Error('Concurrent request detected. Please try again.');
    }

    // Verify OTP hash after securing the slot
    const isValid = await verifyOtp(otp, data.otpHash);
    if (!isValid) {
        res.status(400);
        throw new Error(
            `Invalid OTP. ${data.attempts} attempt${data.attempts === 1 ? '' : 's'} remaining.`
        );
    }

    // ── OTP verified. Begin cascading data erasure. ──────────────────────────

    const userIdStr = String(userId);

    // 1. Find all notes owned by this user
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userNoteIds = (await Note.distinct('_id', { user: userId }).session(session)) as Types.ObjectId[];

        if (userNoteIds.length > 0) {
            // 1a. Delete all Likes on the user's notes (from any user)
            await Like.deleteMany({ noteId: { $in: userNoteIds } }).session(session);

            // 1b. Delete all Reactions on the user's notes (from any user)
            await Reaction.deleteMany({ note: { $in: userNoteIds } }).session(session);

            // 1c. Delete all Comments on the user's notes (from any user, including sub-comments)
            //     We query by noteId so we capture the entire thread regardless of author.
            await Comment.deleteMany({ noteId: { $in: userNoteIds } }).session(session);

            // 1d. Delete the notes themselves
            await Note.deleteMany({ user: userId }).session(session);
        }

        // 2. Delete user's Likes on *other* users' notes and adjust the like counters.
        //    We bulk-adjust instead of per-document to avoid cursor races.
        const userLikes = await Like.find({ userId: userId as Types.ObjectId }, 'noteId').session(session).lean();
        const likedNoteIds = userLikes.map(like => like.noteId);

        if (likedNoteIds.length > 0) {
            await Note.updateMany(
                { _id: { $in: likedNoteIds } },
                { $inc: { likes: -1 } }
            ).session(session);
            await Like.deleteMany({ userId: userId }).session(session);
        }

        // 3. Delete user's Reactions on *other* users' notes and adjust reactionsCount map.
        const userReactions = await Reaction.find({ user: userId as Types.ObjectId }, 'note emoji').session(session).lean();
        if (userReactions.length > 0) {
            // Group reactions by noteId so we can do one updateOne per note
            const reactionsByNote = new Map<string, Map<string, number>>();
            for (const r of userReactions) {
                const noteKey = String(r.note);
                if (!reactionsByNote.has(noteKey)) {
                    reactionsByNote.set(noteKey, new Map());
                }
                const emojiMap = reactionsByNote.get(noteKey)!;
                emojiMap.set(r.emoji, (emojiMap.get(r.emoji) ?? 0) + 1);
            }

            // For each note, build the $inc payload and apply it
            const reactionOps = Array.from(reactionsByNote.entries()).map(([noteId, emojiMap]) => {
                const incPayload: Record<string, number> = {};
                for (const [emoji, count] of emojiMap.entries()) {
                    incPayload[`reactionsCount.${emoji}`] = -count;
                }
                return Note.updateOne({ _id: noteId }, { $inc: incPayload }).session(session);
            });
            await Promise.all(reactionOps);
            await Reaction.deleteMany({ user: userId }).session(session);
        }

        // 4. Delete user's Comments on *other* users' notes.
        //    We must also recursively collect sub-comments the user wrote,
        //    and clean up commentsCount on notes + repliesCount on surviving parent comments.
        const userComments = await Comment.find(
            { user: userId as Types.ObjectId, noteId: { $nin: userNoteIds } },
            '_id noteId parentCommentId'
        ).session(session).lean();

        if (userComments.length > 0) {
            const commentIdsToDelete = new Set<string>(userComments.map((c) => String(c._id)));

            // Recursively find all descendants of the user's comments
            // (replies that other users wrote to the user's comments must also be removed,
            //  otherwise they become dangling — pointing to a non-existent parent)
            const collectDescendants = async (parentIds: string[]): Promise<void> => {
                if (parentIds.length === 0) return;
                const children = await Comment.find(
                    { parentCommentId: { $in: parentIds } },
                    '_id'
                ).session(session).lean();
                if (children.length === 0) return;
                const childIds = children.map((c) => String(c._id));
                for (const id of childIds) commentIdsToDelete.add(id);
                await collectDescendants(childIds);
            };

            await collectDescendants(Array.from(commentIdsToDelete));

            // Gather the full comment docs for deleted IDs so we can compute counter deltas
            const allDeletedComments = await Comment.find(
                { _id: { $in: Array.from(commentIdsToDelete) } },
                'noteId parentCommentId user'
            ).session(session).lean();

            // commentsCount delta per note (count how many we're removing per note)
            const noteCommentDelta = new Map<string, number>();
            // parentComment repliesCount delta — only for parents that survive (not in delete set)
            const parentReplyDelta = new Map<string, number>();

            for (const c of allDeletedComments) {
                const noteKey = String(c.noteId);
                noteCommentDelta.set(noteKey, (noteCommentDelta.get(noteKey) ?? 0) + 1);

                if (c.parentCommentId) {
                    const parentKey = String(c.parentCommentId);
                    // Only decrement parent's repliesCount if the parent itself is NOT being deleted
                    if (!commentIdsToDelete.has(parentKey)) {
                        parentReplyDelta.set(parentKey, (parentReplyDelta.get(parentKey) ?? 0) + 1);
                    }
                }
            }

            // Apply note commentsCount decrements
            const noteCountOps = Array.from(noteCommentDelta.entries()).map(([noteId, delta]) =>
                Note.updateOne({ _id: noteId }, { $inc: { commentsCount: -delta } }).session(session)
            );

            // Apply surviving parent comment repliesCount decrements
            const parentCountOps = Array.from(parentReplyDelta.entries()).map(([commentId, delta]) =>
                Comment.updateOne({ _id: commentId }, { $inc: { repliesCount: -delta } }).session(session)
            );

            await Promise.all([...noteCountOps, ...parentCountOps]);

            // Delete all collected comment IDs in one shot
            await Comment.deleteMany({ _id: { $in: Array.from(commentIdsToDelete) } }).session(session);
        }

        // 5. Delete the user document last — once everything else is cleaned up
        await User.findByIdAndDelete(userId).session(session);

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

    // 7. Clear the access token cookie so the browser is logged out immediately
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted.',
    });
});
