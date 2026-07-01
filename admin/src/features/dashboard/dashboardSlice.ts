import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/getErrorMessage";

export interface DashboardStats {
    users: number;
    notes: number;
    comments: number;
    reactions: number;
}

export interface ChartDataPoint {
    date: string;
    users: number;
    notes: number;
    comments: number;
}

export interface AuditLog {
    _id: string;
    adminId: { _id: string; name: string; email: string };
    action: string;
    targetId: string;
    targetModel: string;
    details: string;
    createdAt: string;
}

export interface DashboardState {
    stats: DashboardStats | null;
    chartData: ChartDataPoint[];
    auditLogs: AuditLog[];
    loading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    stats: null,
    chartData: [],
    auditLogs: [],
    loading: false,
    error: null,
};

export const fetchDashboardStats = createAsyncThunk(
    "dashboard/fetchStats",
    async (_, thunkAPI) => {
        try {
            const res = await api.get("/dashboard/stats");
            return {
                stats: res.data.stats as DashboardStats,
                chartData: res.data.chartData as ChartDataPoint[],
                auditLogs: res.data.auditLogs as AuditLog[]
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload.stats;
                state.chartData = action.payload.chartData;
                state.auditLogs = action.payload.auditLogs;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export default dashboardSlice.reducer;
