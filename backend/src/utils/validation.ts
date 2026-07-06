import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(2, { message: "Name must have at least 2 characters" }).max(50, { message: "Name must have at most 50 characters " }),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string()
        .min(8, { message: "Password must have at least 8 characters" })
        .max(100, { message: "Password must have at most 100 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must have at least 6 characters" }),
});

export const verifyOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }).regex(/^\d+$/, { message: "OTP must be numeric" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
});

export const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }).regex(/^\d+$/, { message: "OTP must be numeric" }),
    newPassword: z.string()
        .min(8, { message: "Password must have at least 8 characters" })
        .max(100, { message: "Password must have at most 100 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;