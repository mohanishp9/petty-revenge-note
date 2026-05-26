import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { TokenPayload } from "../types/session.types";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "15d";
export const REFRESH_TOKEN_EXPIRES_MS = 15 * 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure random refresh token
 * @returns A random string to be used as refresh token
 */
export const generateRefreshTokenString = (): string => {
    return crypto.randomBytes(64).toString("hex");
};

/**
 * Generate an access token with userId and sessionId
 * @param userId - The user's MongoDB ObjectId as string
 * @param sessionId - The session's MongoDB ObjectId as string
 * @returns Signed JWT access token
 */
export const generateAccessToken = (userId: string, sessionId: string): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const payload: Omit<TokenPayload, "iat" | "exp"> = {
        userId,
        sessionId,
        type: "access",
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer: "petty-revenge-notes",
        audience: "petty-revenge-notes-users",
    });
};

/**
 * Generate a refresh token with userId and sessionId
 * @param userId - The user's MongoDB ObjectId as string
 * @param sessionId - The session's MongoDB ObjectId as string
 * @param tokenFamily - The random string secret for rotation
 * @returns Signed JWT refresh token
 */
export const generateRefreshTokenJWT = (
    userId: string,
    sessionId: string,
    tokenFamily: string
): string => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
    }

    const payload: Omit<TokenPayload, "iat" | "exp"> = {
        userId,
        sessionId,
        tokenFamily,
        type: "refresh",
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: "petty-revenge-notes",
        audience: "petty-revenge-notes-users",
    });
};

/**
 * Verify and decode an access token
 * @param token - The JWT access token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "petty-revenge-notes",
            audience: "petty-revenge-notes-users",
        }) as TokenPayload;

        if (decoded.type !== "access") {
            return null;
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.error("Access token expired:", error.expiredAt);
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error("Invalid access token:", error.message);
        }
        return null;
    }
};

/**
 * Verify and decode a refresh token JWT
 * @param token - The JWT refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshTokenJWT = (token: string): TokenPayload | null => {
    try {
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
            issuer: "petty-revenge-notes",
            audience: "petty-revenge-notes-users",
        }) as TokenPayload;

        if (decoded.type !== "refresh") {
            return null;
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.error("Refresh token expired:", error.expiredAt);
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error("Invalid refresh token:", error.message);
        }
        return null;
    }
};

/**
 * Cookie options for refresh token
 * HttpOnly: Not accessible via JavaScript (XSS protection)
 * Secure: Only sent over HTTPS (production)
 * SameSite: Strict for CSRF protection
 */
export const getRefreshTokenCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax" as const,
        maxAge: REFRESH_TOKEN_EXPIRES_MS,
        expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
        path: "/", // Available to all routes
    };
};

/**
 * Clear refresh token cookie options
 */
export const getClearRefreshTokenCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax" as const,
        path: "/",
    };
};
