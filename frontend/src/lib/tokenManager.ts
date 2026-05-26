/**
 * Token Manager - In-Memory Token Storage
 * 
 * SECURITY: Tokens are stored in memory only, NOT in localStorage or sessionStorage.
 * This prevents XSS attacks from accessing tokens.
 * 
 * The module uses a closure to create a private scope for the token,
 * making it inaccessible from outside this module.
 */

type TokenChangeCallback = (token: string | null) => void;

// Private module-level state (closure pattern)
let accessToken: string | null = null;
let tokenChangeCallbacks: Set<TokenChangeCallback> = new Set();

/**
 * Token Manager object with controlled access to the in-memory token
 */
export const tokenManager = {
    /**
     * Get the current access token
     * @returns The access token or null if not set
     */
    getToken(): string | null {
        return accessToken;
    },

    /**
     * Set the access token in memory
     * @param token - The new access token
     */
    setToken(token: string | null): void {
        const previousToken = accessToken;
        accessToken = token;
        
        // Notify subscribers if token changed
        if (previousToken !== token) {
            tokenChangeCallbacks.forEach((callback) => callback(token));
        }
    },

    /**
     * Clear the access token from memory
     */
    clearToken(): void {
        const hadToken = accessToken !== null;
        accessToken = null;
        
        // Notify subscribers that token was cleared
        if (hadToken) {
            tokenChangeCallbacks.forEach((callback) => callback(null));
        }
    },

    /**
     * Check if a token is currently stored
     * @returns true if token exists, false otherwise
     */
    hasToken(): boolean {
        return accessToken !== null && accessToken !== "";
    },

    /**
     * Subscribe to token changes
     * @param callback - Function to call when token changes
     * @returns Unsubscribe function
     */
    onTokenChange(callback: TokenChangeCallback): () => void {
        tokenChangeCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            tokenChangeCallbacks.delete(callback);
        };
    },
};

/**
 * Session flag key for localStorage
 * Used to persist "remember me" state across page reloads
 * NOT used to store the actual token - just a flag
 */
export const SESSION_FLAG_KEY = "hasSession";

export const sessionFlag = {
    set(): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_FLAG_KEY, "true");
        }
    },

    get(): boolean {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(SESSION_FLAG_KEY) === "true";
    },

    clear(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_FLAG_KEY);
        }
    },
};
