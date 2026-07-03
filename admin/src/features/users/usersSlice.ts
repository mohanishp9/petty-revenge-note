import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/getErrorMessage";

export interface UserStats {
    notes: number;
    comments: number;
}

export interface PublicUser {
    _id: string;
    username: string;
    email: string;
    isBanned: boolean;
    createdAt: string;
    stats?: UserStats;
}

interface FetchUsersResponse {
    users: PublicUser[];
    total: number;
    page: number;
    pages: number;
}

export interface UsersState {
    users: PublicUser[];
    selectedUser: PublicUser | null;
    total: number;
    page: number;
    pages: number;
    loading: boolean;
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    selectedUser: null,
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
};

export const fetchUsers = createAsyncThunk(
    "users/fetchUsers",
    async ({ page = 1, search = "", status = "", sort = "-createdAt" }: { page?: number; search?: string; status?: string; sort?: string }, thunkAPI) => {
        try {
            const res = await api.get(`/users?page=${page}&search=${search}&status=${status}&sort=${sort}`);
            return res.data as FetchUsersResponse;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const fetchUserById = createAsyncThunk(
    "users/fetchUserById",
    async (id: string, thunkAPI) => {
        try {
            const res = await api.get(`/users/${id}`);
            return res.data.user as PublicUser;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const toggleUserBan = createAsyncThunk(
    "users/toggleUserBan",
    async (id: string, thunkAPI) => {
        try {
            const res = await api.put(`/users/${id}/ban`);
            return res.data.user as { _id: string; isBanned: boolean };
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const deleteUser = createAsyncThunk(
    "users/deleteUser",
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/users/${id}`);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        clearSelectedUser: (state) => {
            state.selectedUser = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch User By ID
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Toggle Ban
            .addCase(toggleUserBan.fulfilled, (state, action) => {
                if (state.selectedUser && state.selectedUser._id === action.payload._id) {
                    state.selectedUser.isBanned = action.payload.isBanned;
                }
                const index = state.users.findIndex(u => u._id === action.payload._id);
                if (index !== -1) {
                    state.users[index].isBanned = action.payload.isBanned;
                }
            })
            // Delete User
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u._id !== action.payload);
                if (state.selectedUser && state.selectedUser._id === action.payload) {
                    state.selectedUser = null;
                }
                state.total -= 1;
            });
    }
});

export const { clearSelectedUser } = usersSlice.actions;
export default usersSlice.reducer;
