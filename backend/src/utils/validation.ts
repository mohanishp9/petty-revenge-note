import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(2, { message: "Name must have at least 2 characters" })
        .max(50, { message: "Name must have at most 50 characters" }),
    email: z.string().email({ message: "Invalid email" }),
    password: z
        .string()
        .min(6, { message: "Password must have at least 6 characters" })
        .max(100, { message: "Password must have at most 100 characters" }),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().optional(), // Optional because it might come from cookie
});

export const logoutAllSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, {
        message: "Please confirm logout from all devices",
    }).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutAllInput = z.infer<typeof logoutAllSchema>;
