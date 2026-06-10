export interface User {
    _id: string;
    username: string;
    email: string;
    // password: string;
}

export interface AuthResponse {
    success: boolean;
    user: User;
    accessToken: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    error: string | null;
}
