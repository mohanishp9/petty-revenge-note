import { api } from "@/lib/axios";
import { AuthResponse } from "@/features/auth/types";

export const loginAPI = async (data: {
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
};

export const registerAPI = async (data: {
    username: string;
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post("/auth/register", data);
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
