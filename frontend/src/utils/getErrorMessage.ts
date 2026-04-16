type AxiosLikeError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

export const getErrorMessage = (err: unknown): string => {
    if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
    ) {
        const error = err as AxiosLikeError;

        return error.response?.data?.message || "Something went wrong";
    }

    if (err instanceof Error) {
        return err.message;
    }

    return "Something went wrong";
};