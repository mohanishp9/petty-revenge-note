import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllCommentsAPI, addCommentAPI, addReplyAPI, editCommentAPI, deleteCommentAPI } from "@/features/comments/commentsApi";
import { CommentsState, CommentsParams, AddCommentParams, AddReplyParams, EditCommentParams, DeleteCommentParams } from "@/features/comments/types";
import { getErrorMessage } from "@/utils/getErrorMessage";

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
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const addComment = createAsyncThunk(
    "comment/addComment",
    async (params: AddCommentParams, thunkAPI) => {
        try {
            const res = await addCommentAPI(params);

            return res.comment;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const addReply = createAsyncThunk(
    "comment/addReply",
    async (params: AddReplyParams, thunkAPI) => {
        try {
            const res = await addReplyAPI(params);

            return res.reply;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const editComment = createAsyncThunk(
    "comment/editComment",
    async (params: EditCommentParams, thunkAPI) => {
        try {
            const res = await editCommentAPI(params);
            return res.comment;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const deleteComment = createAsyncThunk(
    "comment/deleteComment",
    async (params: DeleteCommentParams, thunkAPI) => {
        try {
            // try to find the comment and compute removed count before deleting
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const state: any = thunkAPI.getState();
            let noteId: string | undefined = undefined;
            let removedCount = 1;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const comments: any[] = state.comments?.comments || [];

            const topIndex = comments.findIndex((c) => c._id === params.commentId);
            if (topIndex !== -1) {
                const comment = comments[topIndex];
                noteId = comment.noteId;
                removedCount = 1 + (comment.replies?.length || 0);
            } else {
                for (const c of comments) {
                    if (c.replies) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const replyIndex = c.replies.findIndex((r: any) => r._id === params.commentId);
                        if (replyIndex !== -1) {
                            noteId = c.noteId;
                            removedCount = 1;
                            break;
                        }
                    }
                }
            }

            await deleteCommentAPI(params);

            return { commentId: params.commentId, noteId, removedCount };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
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

            .addCase(getNoteComments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
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
            .addCase(addReply.fulfilled, (state, action) => {
                const newReply = action.payload;

                // Find the parent comment and add the reply
                const parentComment = state.comments.find(
                    (c) => c._id === newReply.parentCommentId
                );

                if (parentComment) {
                    if (!parentComment.replies) {
                        parentComment.replies = [];
                    }
                    parentComment.replies.push(newReply);
                    parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
                }
            })
            .addCase(editComment.fulfilled, (state, action) => {
                const updatedComment = action.payload;

                if (updatedComment.parentCommentId) {
                    // It's a reply
                    const parentComment = state.comments.find(c => c._id === updatedComment.parentCommentId);
                    if (parentComment && parentComment.replies) {
                        const index = parentComment.replies.findIndex(r => r._id === updatedComment._id);
                        if (index !== -1) {
                            parentComment.replies[index] = updatedComment;
                        }
                    }
                } else {
                    // It's a top-level comment
                    const index = state.comments.findIndex(c => c._id === updatedComment._id);
                    if (index !== -1) {
                        state.comments[index] = {
                            ...state.comments[index],
                            ...updatedComment
                        };
                    }
                }
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                const { commentId: deletedCommentId, noteId: _noteId, removedCount } = action.payload as {
                    commentId: string;
                    noteId?: string;
                    removedCount: number;
                };

                // Check if it's a top-level comment
                const commentIndex = state.comments.findIndex((c) => c._id === deletedCommentId);

                if (commentIndex !== -1) {
                    state.comments.splice(commentIndex, 1);
                    state.total -= removedCount;
                } else {
                    // It might be a reply
                    for (const comment of state.comments) {
                        if (comment.replies) {
                            const replyIndex = comment.replies.findIndex((r) => r._id === deletedCommentId);
                            if (replyIndex !== -1) {
                                comment.replies.splice(replyIndex, 1);
                                comment.repliesCount = (comment.repliesCount || 1) - 1;
                                state.total -= 1;
                                break;
                            }
                        }
                    }
                }
            })
    },
});

export const { resetComments } = commentsSlice.actions;
export default commentsSlice.reducer;
