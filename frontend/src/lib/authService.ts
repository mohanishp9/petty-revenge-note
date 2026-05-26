import { api } from "./axios";
import { tokenManager, sessionFlag } from "./tokenManager";
import type { User, AuthResponse, Session, ApiError } from "@/features/auth/types";

/**
 * Authentication Service
 * 
 * Provides clean API methods for authentication operations.
 * All methods handle token storage automatically.
 */

// LOGIN / REGISTER

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}

/**
 * Login with email and password
 * Stores access token in memory and sets session flag
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    
    if (response.data.success && response.data.accessToken) {
        // Store access token in memory
        tokenManager.setToken(response.data.accessToken);
        
        // Set session flag for persistence
        sessionFlag.set();
    }
    
    return response.data;
}

/**
 * Register a new user
 * Stores access token in memory and sets session flag
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", credentials);
    
    if (response.data.success && response.data.accessToken) {
        // Store access token in memory
        tokenManager.setToken(response.data.accessToken);
        
        // Set session flag for persistence
        sessionFlag.set();
    }
    
    return response.data;
}

// LOGOUT

interface LogoutResponse {
    success: boolean;
    message: string;
}

interface LogoutAllResponse extends LogoutResponse {
    sessionsRevoked: number;
}

/**
 * Logout from current session
 * Clears in-memory token and calls backend to revoke session
 */
export async function logout(): Promise<LogoutResponse> {
    try {
        const response = await api.post<LogoutResponse>("/auth/logout");
        
        // Clear token from memory
        tokenManager.clearToken();
        
        // Clear session flag
        sessionFlag.clear();
        
        return response.data;
    } catch (error) {
        // Clear token even if API call fails
        tokenManager.clearToken();
        sessionFlag.clear();
        
        throw error;
    }
}

/**
 * Logout from ALL devices
 * Revokes all active sessions for the user
 */
export async function logoutAllDevices(): Promise<LogoutAllResponse> {
    try {
        const response = await api.post<LogoutAllResponse>("/auth/logout-all");
        
        // Clear token from memory
        tokenManager.clearToken();
        
        // Clear session flag
        sessionFlag.clear();
        
        return response.data;
    } catch (error) {
        // Clear token even if API call fails
        tokenManager.clearToken();
        sessionFlag.clear();
        
        throw error;
    }
}

// SESSION MANAGEMENT

interface SessionsResponse {
    success: boolean;
    count: number;
    sessions: Session[];
}

interface RevokeSessionResponse {
    success: boolean;
    message: string;
}

/**
 * Get all active sessions for the current user
 */
export async function getActiveSessions(): Promise<Session[]> {
    const response = await api.get<SessionsResponse>("/auth/sessions");
    return response.data.sessions || [];
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<RevokeSessionResponse> {
    const response = await api.delete<RevokeSessionResponse>(`/auth/sessions/${sessionId}`);
    return response.data;
}

// USER PROFILE

interface ProfileResponse {
    success: boolean;
    user: User;
}

/**
 * Get current user profile
 * Requires valid access token
 */
export async function getCurrentUser(): Promise<User> {
    const response = await api.get<ProfileResponse>("/auth/profile");
    return response.data.user;
}

// TOKEN MANAGEMENT

/**
 * Check if user is authenticated (has valid token in memory)
 */
export function isAuthenticated(): boolean {
    return tokenManager.hasToken();
}

/**
 * Get the current access token
 * Useful for WebSocket connections or other non-axios requests
 */
export function getAccessToken(): string | null {
    return tokenManager.getToken();
}

/**
 * Set access token externally
 * Used when restoring session from storage or after manual refresh
 */
export function setAccessToken(token: string): void {
    tokenManager.setToken(token);
}

/**
 * Clear authentication state
 * Called when user explicitly logs out or session expires
 */
export function clearAuth(): void {
    tokenManager.clearToken();
    sessionFlag.clear();
}

/**
 * Check if there's a persisted session flag
 * Used to determine if we should try to refresh tokens on app load
 */
export function hasSessionFlag(): boolean {
    return sessionFlag.get();
}

// EVENT HANDLING

/**
 * Subscribe to authentication state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
    callback: (token: string | null) => void
): () => void {
    return tokenManager.onTokenChange(callback);
}

/**
 * Subscribe to session expired events
 * Called when refresh token fails and user needs to re-login
 */
export function onSessionExpired(
    callback: (detail: { reason: string }) => void
): () => void {
    const handler = (event: CustomEvent<{ reason: string }>) => {
        callback(event.detail);
    };

    window.addEventListener("auth:session-expired", handler as EventListener);

    return () => {
        window.removeEventListener("auth:session-expired", handler as EventListener);
    };
}
