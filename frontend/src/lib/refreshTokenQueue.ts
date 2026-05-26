import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenManager } from "./tokenManager";

/**
 * Request Queue Item
 * Stores the resolve/reject functions and original request config
 * for pending requests waiting for token refresh
 */
interface QueueItem {
    resolve: (token: string) => void;
    reject: (error: Error) => void;
    config: InternalAxiosRequestConfig;
}

/**
 * Refresh Token Queue Manager
 * 
 * Handles concurrent failing requests by:
 * 1. Detecting when a token refresh is in progress
 * 2. Queuing subsequent requests until refresh completes
 * 3. Replaying all queued requests with the new token
 * 
 * This ensures only ONE refresh call is made even if multiple
 * requests fail with 401 simultaneously.
 */
class RefreshTokenQueue {
    private queue: QueueItem[] = [];
    private isRefreshing = false;
    private api: AxiosInstance | null = null;

    /**
     * Initialize the queue with the Axios instance
     * Must be called before using the queue
     */
    initialize(api: AxiosInstance): void {
        this.api = api;
    }

    /**
     * Check if a refresh is currently in progress
     */
    getIsRefreshing(): boolean {
        return this.isRefreshing;
    }

    /**
     * Set the refreshing state
     */
    setIsRefreshing(value: boolean): void {
        this.isRefreshing = value;
    }

    /**
     * Add a request to the queue
     * Returns a promise that resolves when the token is refreshed
     */
    enqueue(config: InternalAxiosRequestConfig): Promise<string> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                config,
            });
        });
    }

    /**
     * Process all queued requests with the new token
     * Called after successful token refresh
     */
    processQueue(newToken: string): void {
        // Process all queued requests
        this.queue.forEach((item) => {
            item.resolve(newToken);
        });

        // Clear the queue
        this.queue = [];
        this.isRefreshing = false;
    }

    /**
     * Reject all queued requests with an error
     * Called when token refresh fails
     */
    rejectQueue(error: Error): void {
        // Reject all queued requests
        this.queue.forEach((item) => {
            item.reject(error);
        });

        // Clear the queue
        this.queue = [];
        this.isRefreshing = false;
    }

    /**
     * Get the number of queued requests
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Clear all queued requests without resolving/rejecting
     */
    clear(): void {
        this.queue = [];
        this.isRefreshing = false;
    }
}

// Export singleton instance
export const refreshTokenQueue = new RefreshTokenQueue();
