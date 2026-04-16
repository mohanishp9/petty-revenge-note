import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginAPI, logoutAPI, registerAPI, getCurrentUserAPI } from "@/features/auth/authApi";
import { AuthState } from "./types";

const SESSION_FLAG = "hasSession";

export const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null,
}

// Login
export const loginUser = createAsyncThunk(
    "auth/login",
    async (data: { email: string; password: string }, thunkAPI) => {
        try {
            const res = await loginAPI(data);
            localStorage.setItem(SESSION_FLAG, "true");
            localStorage.removeItem("token");

            return res;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Login failed"
            );
        }
    }
);

// register
export const registerUser = createAsyncThunk(
    "auth/register",
    async (data: { username: string; email: string; password: string }, thunkAPI ) => {
        try {
            const res = await registerAPI(data);
            localStorage.setItem(SESSION_FLAG, "true");
            localStorage.removeItem("token");

            return res;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || err.message || "Register failed"
            );
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, thunkAPI) => {
        try {
            const res = await logoutAPI();
            localStorage.removeItem(SESSION_FLAG);
            localStorage.removeItem("token");
            return res;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Logout failed"
            );
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    "auth/getCurrentUser",
    async (_, thunkAPI) => {
        try {
            const res = await getCurrentUserAPI();
            return res.user;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch user"
            );
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            localStorage.removeItem(SESSION_FLAG);
            localStorage.removeItem("token");
        },
        setUserFromStorage(state) {
            if (typeof window !== "undefined") {
                const hasSession = localStorage.getItem(SESSION_FLAG) === "true";
                state.token = hasSession ? "cookie-session" : null;
            }
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

        // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = "cookie-session";
            })
            .addCase(loginUser.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })

        // register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = "cookie-session";
            })
            .addCase(registerUser.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
            })
            .addCase(logoutUser.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.token = "cookie-session";
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
            });
    },
});

export const { logout, setUserFromStorage, clearError } = authSlice.actions;
export default authSlice.reducer;
