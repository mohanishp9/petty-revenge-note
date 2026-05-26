import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenManager } from "./tokenManager";

/**
 * Request Interceptor for Authentication
 * 
 * Automatically attaches the in-memory access token to requests.
 * This runs BEFORE the request is sent.
 */
export function createAuthInterceptor(api: AxiosInstance): void {
    api.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            // Get token from memory
            const token = tokenManager.getToken();

            // Attach token if it exists and no Authorization header is already set
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
}

/**
 * Remove Authorization header from a specific request config
 * Useful for public endpoints that don't need auth
 */
export function withoutAuth<T extends InternalAxiosRequestConfig>(
    config: T
): T {
    delete config.headers.Authorization;
    return config;
}
