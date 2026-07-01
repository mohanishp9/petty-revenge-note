import { api } from "@/lib/axios";
import { AuthResponse } from "./types";

export const loginAdminAPI = async (data: {
    email: string;
    password: string;
}): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
};

export const logoutAdminAPI = async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post("/auth/logout");
    return res.data;
};

export const getAdminProfileAPI = async () => {
    const res = await api.get("/auth/profile");
    return res.data;
};

export const refreshAdminTokenAPI = async (): Promise<{ success: boolean; accessToken: string }> => {
    const res = await api.post("/auth/refresh");
    return res.data;
};

export const changeAdminPasswordAPI = async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put("/auth/password", data);
    return res.data;
};
