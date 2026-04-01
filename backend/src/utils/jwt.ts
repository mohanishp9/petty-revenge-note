import jwt from "jsonwebtoken";

export interface JWTPayload {
    id: string;
    iat: number;
    exp: number;
}

export const generateToken = (userId: string): string => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
}

export const verifyToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    } catch (error) {
        console.error('Failed to verify token: ', error);
        return null;
    }
};