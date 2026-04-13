import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllCommentsAPI, addCommentAPI } from "@/features/comments/commentsApi";
import { CommentsState, CommentsParams, AddCommentParams } from "@/features/comments/types";

export const initialState: CommentsState = {
    comments: [],
    loading: false,
    error: null,

    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
    currentNoteId: null,
}

export const getNoteComments = createAsyncThunk(
    "comments/getNoteComments",
    async (params: CommentsParams, thunkAPI) => {
        try {
            const res = await getAllCommentsAPI(params);

            return {
                ...res,
                page: params.page || 1
            };
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch comments"
            );
        }
    }
);

export const addComment = createAsyncThunk(
    "comment/addComment",
    async (params: AddCommentParams, thunkAPI) => {
        try {
            const res = await addCommentAPI(params);

            return res.comment;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to add comment"
            );
        }
    }
);

const commentsSlice = createSlice({
    name: "comments",
    initialState,
    reducers: {
        resetComments(state) {
            state.comments = [];
            state.page = 1;
            state.hasMore = true;
            state.total = 0;
            state.error = null;
            state.currentNoteId = null;
        }
    },
    extraReducers: (builder) => {
        builder

            .addCase(getNoteComments.pending, (state, action) => {
                const { noteId, page = 1 } = action.meta.arg;
                state.loading = true;
                state.error = null;

                if (page === 1 && state.currentNoteId !== noteId) {
                    state.comments = [];
                }

                state.currentNoteId = noteId;
            })

            .addCase(getNoteComments.fulfilled, (state, action) => {
                const { comments, page, total, hasMore } = action.payload;
                const noteId = action.meta.arg.noteId;

                state.loading = false;
                state.currentNoteId = noteId;

                // pagination append
                state.comments =
                    page > 1
                        ? [
                            ...state.comments,
                            ...comments.filter(
                                (c) =>
                                    !state.comments.some(
                                        (existing) => existing._id === c._id
                                    )
                            ),
                        ]
                        : comments;

                state.page = page;
                state.total = total;
                state.hasMore = hasMore;
            })

            .addCase(getNoteComments.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addComment.fulfilled,  (state, action) => {
                const newComment = action.payload;

                if (state.currentNoteId !== newComment.noteId) return;

                state.comments.unshift(newComment);

                state.total += 1;

                if (state.comments.length > state.limit) {
                    state.comments.pop();
                }
            })
    },
});

export const { resetComments } = commentsSlice.actions;
export default commentsSlice.reducer;
