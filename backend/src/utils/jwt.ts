import jwt from "jsonwebtoken";

export interface JWTPayload {
    id: string;
    iat: number;
    exp: number;
}

export const generateAccessToken = (userId: string): string => {
    return jwt.sign({  id: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
}

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
}

export const verifyAccessToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JWTPayload;
    } catch (error) {
        console.error('Failed to verify access token: ', error);
        return null;
    }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JWTPayload;
    } catch (error) {
        console.error('Failed to verify refresh token: ', error);
        return null;
    }
}