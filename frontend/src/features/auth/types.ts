export interface User {
    _id: string;
    username: string;
    email: string;
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
    error: string | OtpError | null;
    isInitialized: boolean;
}

// Used by OTP thunks so the page can distinguish HTTP status codes (409, 429, 400)
export interface OtpError {
    message: string;
    status: number;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResendOtpRequest {
    email: string;
}

