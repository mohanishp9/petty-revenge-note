import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenManager, sessionFlag } from "./tokenManager";
import { refreshTokenQueue } from "./refreshTokenQueue";

/**
 * Refresh Token Service
 * 
 * Handles the silent refresh logic:
 * 1. Detects 401 errors
 * 2. Calls the refresh endpoint
 * 3. Updates the in-memory token
 * 4. Retries failed requests
 */

interface RefreshResponse {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken?: string;
}

interface RefreshError {
    success: boolean;
    message: string;
    securityIncident?: boolean;
}

// Track if we're in the middle of handling a refresh failure
// to prevent infinite loops
let isHandlingRefreshFailure = false;

/**
 * Create the refresh token interceptor for an Axios instance
 */
export function createRefreshTokenInterceptor(api: AxiosInstance): void {
    // Initialize the queue with the API instance
    refreshTokenQueue.initialize(api);

    // Response interceptor for handling 401 errors
    api.interceptors.response.use(
        // Successful responses pass through
        (response) => response,
        // Error handler for 401s
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & {
                _retry?: boolean;
            };

            // Only handle 401 errors
            if (error.response?.status !== 401) {
                return Promise.reject(error);
            }

            // Skip refresh for the refresh endpoint itself to prevent infinite loops
            if (originalRequest.url?.includes("/auth/refresh")) {
                handleRefreshFailure();
                return Promise.reject(error);
            }

            // Skip refresh for login/register endpoints
            if (
                originalRequest.url?.includes("/auth/login") ||
                originalRequest.url?.includes("/auth/register")
            ) {
                return Promise.reject(error);
            }

            // If request was already retried, don't try again
            if (originalRequest._retry) {
                handleRefreshFailure();
                return Promise.reject(error);
            }

            // Mark request as retried
            originalRequest._retry = true;

            // If refresh is already in progress, queue this request
            if (refreshTokenQueue.getIsRefreshing()) {
                try {
                    // Wait for the new token
                    const newToken = await refreshTokenQueue.enqueue(originalRequest);
                    
                    // Retry with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (queueError) {
                    return Promise.reject(queueError);
                }
            }

            // Start refresh process
            refreshTokenQueue.setIsRefreshing(true);

            try {
                // Call refresh endpoint (cookies are sent automatically)
                const response = await api.post<RefreshResponse>("/auth/refresh");

                if (response.data.success && response.data.accessToken) {
                    const newToken = response.data.accessToken;

                    // Update in-memory token
                    tokenManager.setToken(newToken);

                    // Update original request header
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    // Process queued requests with new token
                    refreshTokenQueue.processQueue(newToken);

                    // Retry original request
                    return api(originalRequest);
                } else {
                    throw new Error("Token refresh failed: Invalid response");
                }
            } catch (refreshError) {
                const axiosError = refreshError as AxiosError<RefreshError>;
                const status = axiosError.response?.status;
                const errorData = axiosError.response?.data;

                // ONLY clear session if it's an authentication error (401 or 403)
                // This prevents logging out on network errors or server 500s
                if (status === 401 || status === 403) {
                    // Check for security incident (token reuse detected)
                    if (errorData?.securityIncident) {
                        console.warn("Security incident detected: Token reuse. All sessions revoked.");
                    }

                    // Handle refresh failure (clears tokens and flag)
                    handleRefreshFailure();

                    const error = new Error(
                        errorData?.message || "Session expired. Please login again."
                    );
                    refreshTokenQueue.rejectQueue(error);
                    return Promise.reject(error);
                } else {
                    // For network errors, 500s, etc., don't clear the session flag
                    // Just reset the refreshing state so it can be tried again
                    refreshTokenQueue.setIsRefreshing(false);
                    refreshTokenQueue.rejectQueue(new Error("Network error during token refresh"));
                    return Promise.reject(refreshError);
                }
            }
        }
    );
}

/**
 * Handle refresh token failure
 * Clears tokens and session, can trigger redirect to login
 */
function handleRefreshFailure(): void {
    if (isHandlingRefreshFailure) {
        return; // Prevent multiple handlers
    }

    isHandlingRefreshFailure = true;

    // Clear in-memory token
    tokenManager.clearToken();

    // Clear session flag
    sessionFlag.clear();

    // Clear the request queue
    refreshTokenQueue.clear();

    // Emit a custom event that the app can listen to for redirect
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("auth:session-expired", {
                detail: { reason: "token_refresh_failed" },
            })
        );
    }

    // Reset flag after a short delay
    setTimeout(() => {
        isHandlingRefreshFailure = false;
    }, 1000);
}

/**
 * Manually trigger a token refresh
 * Useful for proactive refresh before token expires
 */
export async function manualRefresh(api: AxiosInstance): Promise<string | null> {
    try {
        const response = await api.post<RefreshResponse>("/auth/refresh");

        if (response.data.success && response.data.accessToken) {
            tokenManager.setToken(response.data.accessToken);
            return response.data.accessToken;
        }

        return null;
    } catch (error) {
        handleRefreshFailure();
        return null;
    }
}
