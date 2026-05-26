/**
 * Authentication Types
 */

export interface User {
    _id: string;
    username: string;
    email: string;
}

export interface Session {
    _id: string;
    ip: string;
    userAgent: string;
    createdAt: string;
    updatedAt: string;
    isCurrentSession: boolean;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user: User;
    accessToken: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface ApiError {
    success: false;
    message: string;
    securityIncident?: boolean;
}

// Redux Action Types

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export interface AuthActionError {
    message: string;
}
