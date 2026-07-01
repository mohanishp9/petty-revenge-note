export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
}

export interface AuthResponse {
    success: boolean;
    user: AdminUser;
    accessToken: string;
}

export interface AuthState {
    user: AdminUser | null;
    accessToken: string | null;
    loading: boolean;
    isInitialized: boolean;
    error: string | null;
}
