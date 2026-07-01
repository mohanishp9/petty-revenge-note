import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/getErrorMessage";
import toast from "react-hot-toast";

export interface SystemSettings {
    maintenanceMode: boolean;
    disableSignups: boolean;
}

interface SettingsState {
    settings: SystemSettings | null;
    loading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    settings: null,
    loading: false,
    error: null,
};

export const fetchSystemSettings = createAsyncThunk(
    "settings/fetchSettings",
    async (_, thunkAPI) => {
        try {
            const res = await api.get("/settings");
            return res.data.settings as SystemSettings;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const updateSystemSettings = createAsyncThunk(
    "settings/updateSettings",
    async (newSettings: Partial<SystemSettings>, thunkAPI) => {
        try {
            const res = await api.put("/settings", newSettings);
            return res.data.settings as SystemSettings;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSystemSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSystemSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = action.payload;
            })
            .addCase(fetchSystemSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateSystemSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSystemSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = action.payload;
                toast.success("SYSTEM CONTROLS UPDATED.", {
                    style: { borderRadius: '0px', background: '#0a0a0a', color: '#06b6d4', border: '1px solid #1f1f1f' }
                });
            })
            .addCase(updateSystemSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string || "UPDATE FAILED");
            });
    }
});

export default settingsSlice.reducer;
