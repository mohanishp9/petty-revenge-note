import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginAPI, logoutAPI, initiateRegistrationAPI, verifyRegistrationOtpAPI, resendOtpAPI, getCurrentUserAPI, refreshTokenAPI, updateUsernameAPI, updatePasswordAPI, verifyEmailUpdateAPI } from "@/features/auth/authApi";
import { AuthState, OtpError } from "./types";
import { getErrorMessage, getErrorStatus } from "@/utils/getErrorMessage";

export const initialState: AuthState = {
    user: null,
    accessToken: null,
    loading: false,
    error: null,
}

export const refreshToken = createAsyncThunk(
    "auth/refreshToken",
    async (_, thunkAPI) => {
        try {
            const res = await refreshTokenAPI();
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
)

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

export const initiateRegistration = createAsyncThunk(
    "auth/initiateRegistration",
    async (data: { username: string; email: string; password: string }, thunkAPI) => {
        try {
            const res = await initiateRegistrationAPI(data);
            // Save pending email to localStorage so refresh doesn't lose step 2 context
            if (typeof window !== "undefined") {
                localStorage.setItem("registration_pending_email", data.email);
            }
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue({
                message: getErrorMessage(err),
                status: getErrorStatus(err),
            } satisfies OtpError);
        }
    }
);

export const verifyRegistrationOtp = createAsyncThunk(
    "auth/verifyRegistrationOtp",
    async (data: { email: string; otp: string }, thunkAPI) => {
        try {
            const res = await verifyRegistrationOtpAPI(data);
            // Clear pending state on success
            if (typeof window !== "undefined") {
                localStorage.removeItem("registration_pending_email");
            }
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue({
                message: getErrorMessage(err),
                status: getErrorStatus(err),
            } satisfies OtpError);
        }
    }
);

export const resendOtp = createAsyncThunk(
    "auth/resendOtp",
    async (data: { email: string }, thunkAPI) => {
        try {
            const res = await resendOtpAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue({
                message: getErrorMessage(err),
                status: getErrorStatus(err),
            } satisfies OtpError);
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, thunkAPI) => {
        try {
            const res = await logoutAPI();
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    "auth/getCurrentUser",
    async (_, thunkAPI) => {
        try {
            const res = await getCurrentUserAPI();
            return res.user;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// --- Profile Management ---

export const updateUsername = createAsyncThunk(
    "auth/updateUsername",
    async (data: { username: string }, thunkAPI) => {
        try {
            const res = await updateUsernameAPI(data);
            return res; // { success: true, user: User, message: string }
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const updatePassword = createAsyncThunk(
    "auth/updatePassword",
    async (data: { currentPassword: string; newPassword: string }, thunkAPI) => {
        try {
            const res = await updatePasswordAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const verifyEmailUpdate = createAsyncThunk(
    "auth/verifyEmailUpdate",
    async (data: { otp: string }, thunkAPI) => {
        try {
            const res = await verifyEmailUpdateAPI(data);
            return res; // { success: true, user: User, message: string }
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(refreshToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(refreshToken.rejected, (state) => {
                state.loading = false;
                state.accessToken = null;
            })

            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(initiateRegistration.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initiateRegistration.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(initiateRegistration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as OtpError;
            })

            .addCase(verifyRegistrationOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyRegistrationOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(verifyRegistrationOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as OtpError;
            })

            .addCase(resendOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resendOtp.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resendOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as OtpError;
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
            })
            
            // --- Profile Management ---
            .addCase(updateUsername.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUsername.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user = action.payload.user; // Update global user state
                }
            })
            .addCase(updateUsername.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(verifyEmailUpdate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyEmailUpdate.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user = action.payload.user; // Update global user state
                }
            })
            .addCase(verifyEmailUpdate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string; // Usually contains attempts logic message
            })

            .addCase(updatePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
