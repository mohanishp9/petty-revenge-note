import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginAdminAPI, logoutAdminAPI, getAdminProfileAPI, refreshAdminTokenAPI, changeAdminPasswordAPI } from "./authApi";
import { AuthState } from "./types";
import { getErrorMessage } from "@/utils/getErrorMessage";

const initialState: AuthState = {
    user: null,
    accessToken: null,
    loading: false,
    isInitialized: false,
    error: null,
};

export const refreshAdminToken = createAsyncThunk(
    "auth/refreshAdminToken",
    async (_, thunkAPI) => {
        try {
            const res = await refreshAdminTokenAPI();
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const loginAdmin = createAsyncThunk(
    "auth/loginAdmin",
    async (data: Parameters<typeof loginAdminAPI>[0], thunkAPI) => {
        try {
            const res = await loginAdminAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const logoutAdmin = createAsyncThunk(
    "auth/logoutAdmin",
    async (_, thunkAPI) => {
        try {
            const res = await logoutAdminAPI();
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const getAdminProfile = createAsyncThunk(
    "auth/getAdminProfile",
    async (_, thunkAPI) => {
        try {
            const res = await getAdminProfileAPI();
            return res.user;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const changeAdminPassword = createAsyncThunk(
    "auth/changeAdminPassword",
    async (data: Parameters<typeof changeAdminPasswordAPI>[0], thunkAPI) => {
        try {
            const res = await changeAdminPasswordAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(refreshAdminToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(refreshAdminToken.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(refreshAdminToken.rejected, (state) => {
                state.loading = false;
                state.accessToken = null;
                state.isInitialized = true; // Mark initialized even if failed (means they are a guest)
            })

            .addCase(loginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isInitialized = true;
            })
            .addCase(loginAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(logoutAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutAdmin.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
                state.isInitialized = true;
            })
            .addCase(logoutAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(getAdminProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAdminProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isInitialized = true;
            })
            .addCase(getAdminProfile.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.accessToken = null;
                state.isInitialized = true;
            });
    }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
