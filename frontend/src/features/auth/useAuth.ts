"use client";

import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState, AppDispatch } from "@/store/store";
import {
    loginUser,
    registerUser,
    logoutUser,
    logoutAllUserDevices,
    fetchCurrentUser,
    clearError,
    initializeAuth,
} from "./authSlice";
import { tokenManager, sessionFlag } from "@/lib/tokenManager";
import { onSessionExpired } from "@/lib/authService";
import type { LoginPayload, RegisterPayload, Session } from "./types";
import { getActiveSessionsAPI, revokeSessionAPI } from "./authApi";

/**
 * Custom hook for authentication operations
 * Provides a clean interface for components to interact with auth state
 */
export function useAuth() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const { user, accessToken, isAuthenticated, loading, error } = useSelector(
        (state: RootState) => state.auth
    );

    /**
     * Initialize auth state on mount
     * Attempts to restore session if session flag exists
     */
    useEffect(() => {
        // Initialize from token manager
        dispatch(initializeAuth());

        // If we have a session flag but no user, try to fetch user
        // This handles page reload where token is in memory via refresh
        if (sessionFlag.get() && !user) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, user]);

    /**
     * Listen for session expired events
     * Redirects to login when refresh token fails
     */
    useEffect(() => {
        const unsubscribe = onSessionExpired(({ reason }) => {
            console.log(`Session expired: ${reason}`);
            dispatch(clearError());
            // Redirect to login page
            router.push("/login?session=expired");
        });

        return unsubscribe;
    }, [dispatch, router]);

    /**
     * Subscribe to token changes (for debugging or syncing)
     */
    useEffect(() => {
        const unsubscribe = tokenManager.onTokenChange((token) => {
            if (!token && isAuthenticated) {
                // Token was cleared externally, update state
                dispatch(clearError());
            }
        });

        return unsubscribe;
    }, [dispatch, isAuthenticated]);

    /**
     * Login with email and password
     */
    const login = useCallback(
        async (credentials: LoginPayload) => {
            const result = await dispatch(loginUser(credentials));
            if (loginUser.fulfilled.match(result)) {
                return { success: true, user: result.payload.user };
            }
            return { success: false, error: result.payload as string };
        },
        [dispatch]
    );

    /**
     * Register a new user
     */
    const register = useCallback(
        async (credentials: RegisterPayload) => {
            const result = await dispatch(registerUser(credentials));
            if (registerUser.fulfilled.match(result)) {
                return { success: true, user: result.payload.user };
            }
            return { success: false, error: result.payload as string };
        },
        [dispatch]
    );

    /**
     * Logout from current session
     */
    const logout = useCallback(async () => {
        await dispatch(logoutUser());
        router.push("/login");
    }, [dispatch, router]);

    /**
     * Logout from all devices
     */
    const logoutAll = useCallback(async () => {
        const result = await dispatch(logoutAllUserDevices());
        router.push("/login");
        return result;
    }, [dispatch, router]);

    /**
     * Get all active sessions
     */
    const getSessions = useCallback(async (): Promise<Session[]> => {
        try {
            const res = await getActiveSessionsAPI();
            return res.sessions;
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            return [];
        }
    }, []);

    /**
     * Revoke a specific session
     */
    const revokeSession = useCallback(async (sessionId: string) => {
        try {
            const res = await revokeSessionAPI(sessionId);
            return { success: res.success, message: res.message };
        } catch (error) {
            return { success: false, message: "Failed to revoke session" };
        }
    }, []);

    /**
     * Clear error message
     */
    const clearAuthError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    /**
     * Check if user is authenticated
     */
    const checkAuth = useCallback(() => {
        return tokenManager.hasToken() && isAuthenticated;
    }, [isAuthenticated]);

    /**
     * Get access token for external use (WebSockets, etc.)
     */
    const getToken = useCallback(() => {
        return tokenManager.getToken();
    }, []);

    return {
        // State
        user,
        accessToken,
        isAuthenticated,
        loading,
        error,

        // Actions
        login,
        register,
        logout,
        logoutAll,
        getSessions,
        revokeSession,
        clearAuthError,
        checkAuth,
        getToken,

        // Utilities
        fetchCurrentUser: () => dispatch(fetchCurrentUser()),
    };
}
