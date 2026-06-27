import { api } from "@/lib/axios";
import { AuthResponse } from "@/features/auth/types";

export const loginAPI = async (data: {
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
};

export const initiateRegistrationAPI = async (data: {
    username: string;
    email: string;
    password: string;
}): Promise<{ success: boolean; message: string }> => {
    const res = await api.post("/auth/register/initiate", data);
    return res.data;
};

export const verifyRegistrationOtpAPI = async (data: {
    email: string;
    otp: string;
}): Promise<AuthResponse> => {
    const res = await api.post("/auth/register/verify", data);
    return res.data;
};

export const resendOtpAPI = async (data: {
    email: string;
}): Promise<{ success: boolean; message: string }> => {
    const res = await api.post("/auth/register/resend", data);
    return res.data;
};

export const logoutAPI = async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post("/auth/logout");
    return res.data;
};

export const getCurrentUserAPI = async () => {
    const res = await api.get("/auth/profile");
    return res.data;
};

export const refreshTokenAPI = async (): Promise<{ success: boolean; accessToken: string }> => {
    const res = await api.post("/auth/refresh");
    return res.data;
};

// --- Profile Management ---

export const checkUsernameAPI = async (username: string): Promise<{ success: boolean; available: boolean }> => {
    const res = await api.get(`/users/profile/check-username?username=${encodeURIComponent(username)}`);
    return res.data;
};

export const updateUsernameAPI = async (data: { username: string }) => {
    const res = await api.put("/users/profile/username", data);
    return res.data; // { success: true, user: User, message: string }
};

export const updatePasswordAPI = async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put("/users/profile/password", data);
    return res.data;
};

export const initiateEmailUpdateAPI = async (data: { newEmail: string; password: string }) => {
    const res = await api.post("/users/profile/email/initiate", data);
    return res.data;
};

export const verifyEmailUpdateAPI = async (data: { otp: string }) => {
    const res = await api.post("/users/profile/email/verify", data);
    return res.data; // { success: true, user: User, message: string }
};