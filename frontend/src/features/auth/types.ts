export interface User {
    _id: string;
    username: string;
    email: string;
    // password: string;
}

export interface AuthResponse {
    success: boolean;
    user: User;
    token: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}
