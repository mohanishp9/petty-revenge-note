import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    loginAPI,
    logoutAPI,
    registerAPI,
    getCurrentUserAPI,
    logoutAllDevicesAPI,
} from "@/features/auth/authApi";
import { AuthState } from "./types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { tokenManager, sessionFlag } from "@/lib/tokenManager";

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};


// ASYNC THUNKS


/**
 * Login user
 */
export const loginUser = createAsyncThunk(
    "auth/login",
    async (data: { email: string; password: string }, thunkAPI) => {
        try {
            const res = await loginAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

/**
 * Register user
 */
export const registerUser = createAsyncThunk(
    "auth/register",
    async (data: { username: string; email: string; password: string }, thunkAPI) => {
        try {
            const res = await registerAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

/**
 * Logout user (current session only)
 */
export const logoutUser = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
    try {
        const res = await logoutAPI();
        return res;
    } catch (err) {
        return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
});

/**
 * Logout from all devices
 */
export const logoutAllUserDevices = createAsyncThunk(
    "auth/logoutAll",
    async (_, thunkAPI) => {
        try {
            const res = await logoutAllDevicesAPI();
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

/**
 * Get current user (restore session on app load)
 */
export const fetchCurrentUser = createAsyncThunk(
    "auth/fetchCurrentUser",
    async (_, thunkAPI) => {
        try {
            const res = await getCurrentUserAPI();
            return res.user;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// AUTH SLICE

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        /**
         * Set user from external source (e.g., session restoration)
         */
        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },

        /**
         * Update access token in state
         */
        setAccessToken(state, action) {
            state.accessToken = action.payload;
            state.isAuthenticated = !!action.payload;
        },

        /**
         * Clear all auth state
         */
        clearAuthState(state) {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.error = null;
            tokenManager.clearToken();
            sessionFlag.clear();
        },

        /**
         * Clear error message
         */
        clearError(state) {
            state.error = null;
        },

        /**
         * Initialize auth state from token manager
         * Call this on app startup
         */
        initializeAuth(state) {
            const token = tokenManager.getToken();
            if (token) {
                state.accessToken = token;
                state.isAuthenticated = true;
            }
        },
    },
    extraReducers: (builder) => {
        // LOGIN
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // REGISTER
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // LOGOUT (Single Session)
        builder
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // Still clear auth state on logout error
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            });

        // LOGOUT ALL DEVICES
        builder
            .addCase(logoutAllUserDevices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutAllUserDevices.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            })
            .addCase(logoutAllUserDevices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // Still clear auth state on logout error
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            });

        // FETCH CURRENT USER
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                // Token is already in memory from refresh
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                // We don't clear the state here because handleRefreshFailure 
                // in the interceptor will handle clearing if it was an auth failure.
                // If it was a network failure, we want to keep the session flag.
                state.error = action.payload as string;
            });
    },
});

// EXPORTS

export const {
    setUser,
    setAccessToken,
    clearAuthState,
    clearError,
    initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;
