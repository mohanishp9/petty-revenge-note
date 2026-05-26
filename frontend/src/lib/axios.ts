import axios from "axios";
import { createAuthInterceptor } from "./authInterceptor";
import { createRefreshTokenInterceptor } from "./refreshTokenService";

/**
 * API Configuration
 */

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Base URL from environment variable
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Axios Instance Configuration
 * 
 * Key settings:
 * - baseURL: API endpoint from env
 * - withCredentials: true (sends/receives cookies for refresh token)
 * - headers: JSON content type
 */
export const api = axios.create({
    baseURL,
    withCredentials: true, // Required for HttpOnly cookie-based refresh tokens
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
});

// Apply interceptors
createAuthInterceptor(api); // Attaches access token to requests
createRefreshTokenInterceptor(api); // Handles 401s with silent refresh

/**
 * Public API Instance (No Auth)
 * Use for endpoints that don't require authentication
 */
export const publicApi = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

/**
 * Get the base URL (useful for constructing full URLs)
 */
export function getBaseURL(): string {
    return baseURL;
}

/**
 * Check if API is reachable (health check)
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await publicApi.get("/health");
        return response.data?.success === true;
    } catch {
        return false;
    }
}
