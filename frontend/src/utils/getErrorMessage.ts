/**
 * Extract error message from API error response
 */

interface ApiErrorResponse {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    message?: string;
}

/**
 * Get a user-friendly error message from an error object
 * Handles Axios errors, network errors, and generic errors
 */
export const getErrorMessage = (err: unknown): string => {
    // Handle Axios-style errors
    if (typeof err === "object" && err !== null) {
        const axiosError = err as ApiErrorResponse;

        // Check for API error response
        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }

        // Check for network error
        if (axiosError.message === "Network Error") {
            return "Unable to connect to server. Please check your connection.";
        }

        // Check for timeout
        if (axiosError.message?.includes("timeout")) {
            return "Request timed out. Please try again.";
        }
    }

    // Handle Error instances
    if (err instanceof Error) {
        return err.message;
    }

    // Handle string errors
    if (typeof err === "string") {
        return err;
    }

    // Fallback
    return "An unexpected error occurred. Please try again.";
};
