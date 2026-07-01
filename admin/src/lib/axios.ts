import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
    baseURL: `${API_URL}/api/admin`,
    withCredentials: true,
});

export const setAccessToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${API_URL}/api/admin/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                
                const newAccessToken = res.data.accessToken;
                
                // We don't dispatch to Redux here directly to avoid circular dependencies.
                // The Redux session restorer handles the global refresh, but this intercepts 
                // in-flight requests and replays them.
                setAccessToken(newAccessToken);
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, we clear token.
                setAccessToken(null);
                // Dispatching a logout event or just letting the component redirect
                if (typeof window !== "undefined") {
                    // Optional: window.location.href = '/login'
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
