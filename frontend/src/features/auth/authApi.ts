import { api } from "@/lib/axios";
import { tokenManager, sessionFlag } from "@/lib/tokenManager";
import type { AuthResponse, User, Session } from "./types";

// Authentication API Endpoints

/**
 * Login with email and password
 */
export const loginAPI = async (data: {
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);

    // Store token in memory on successful login
    if (res.data.success && res.data.accessToken) {
        tokenManager.setToken(res.data.accessToken);
        sessionFlag.set();
    }

    return res.data;
};

/**
 * Register a new user
 */
export const registerAPI = async (data: {
    username: string;
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);

    // Store token in memory on successful registration
    if (res.data.success && res.data.accessToken) {
        tokenManager.setToken(res.data.accessToken);
        sessionFlag.set();
    }

    return res.data;
};

/**
 * Logout from current session
 */
export const logoutAPI = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.post("/auth/logout");
        return res.data;
    } finally {
        // Always clear tokens, even if API call fails
        tokenManager.clearToken();
        sessionFlag.clear();
    }
};

/**
 * Logout from all devices
 */
export const logoutAllDevicesAPI = async (): Promise<{
    success: boolean;
    message: string;
    sessionsRevoked: number;
}> => {
    try {
        const res = await api.post("/auth/logout-all");
        return res.data;
    } finally {
        // Always clear tokens
        tokenManager.clearToken();
        sessionFlag.clear();
    }
};

/**
 * Get current user profile
 */
export const getCurrentUserAPI = async (): Promise<{ success: boolean; user: User }> => {
    const res = await api.get("/auth/profile");
    return res.data;
};

/**
 * Get all active sessions
 */
export const getActiveSessionsAPI = async (): Promise<{
    success: boolean;
    count: number;
    sessions: Session[];
}> => {
    const res = await api.get("/auth/sessions");
    return res.data;
};

/**
 * Revoke a specific session
 */
export const revokeSessionAPI = async (
    sessionId: string
): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/auth/sessions/${sessionId}`);
    return res.data;
};

export const refreshTokensAPI = async (): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/refresh");

    if (res.data.success && res.data.accessToken) {
        tokenManager.setToken(res.data.accessToken);
    }

    return res.data;
};
