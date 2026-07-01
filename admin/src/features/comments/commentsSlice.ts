import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCommentsAPI, deleteCommentAdminAPI } from "./commentsApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

export interface ModerationComment {
    _id: string;
    text: string;
    noteId?: { _id: string; subject: string };
    user?: { _id: string; username: string; email: string };
    repliesCount: number;
    parentCommentId?: string;
    createdAt: string;
}

export interface CommentsState {
    comments: ModerationComment[];
    loading: boolean;
    error: string | null;
    total: number;
    page: number;
    pages: number;
}

const initialState: CommentsState = {
    comments: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pages: 1,
};

export const fetchComments = createAsyncThunk(
    "comments/fetchComments",
    async ({ page, search }: { page: number; search: string }, thunkAPI) => {
        try {
            return await fetchCommentsAPI(page, search);
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const deleteCommentAdmin = createAsyncThunk(
    "comments/deleteCommentAdmin",
    async (id: string, thunkAPI) => {
        try {
            await deleteCommentAdminAPI(id);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

const commentsSlice = createSlice({
    name: "comments",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Comments
            .addCase(fetchComments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchComments.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = action.payload.comments;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(fetchComments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Delete Comment
            .addCase(deleteCommentAdmin.fulfilled, (state, action) => {
                state.comments = state.comments.filter(c => c._id !== action.payload);
                state.total -= 1;
            });
    },
});

export default commentsSlice.reducer;
