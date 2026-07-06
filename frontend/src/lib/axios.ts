import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 503) {
            if (typeof window !== "undefined" && window.location.pathname !== "/maintenance") {
                window.location.href = "/maintenance";
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't intercept loops on auth endpoints
            if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh-token")) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use bare axios to avoid triggering this interceptor again on failure
                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {}, {
                    withCredentials: true
                });

                if (res.data?.accessToken) {
                    setAccessToken(res.data.accessToken);
                    originalRequest.headers['Authorization'] = 'Bearer ' + res.data.accessToken;
                    processQueue(null, res.data.accessToken);
                    return api(originalRequest);
                } else {
                    throw new Error("No token returned");
                }
            } catch (err) {
                processQueue(err, null);
                setAccessToken(null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
