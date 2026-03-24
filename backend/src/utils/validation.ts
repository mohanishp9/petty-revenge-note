import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(2, { message: "Name must have at least 2 characters" }).max(50, { message: "Name must have at most 50 characters " }),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must have at least 6 characters" }).max(100, { message: "Password must have at most 100 characters" }),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must have at least 6 characters" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;