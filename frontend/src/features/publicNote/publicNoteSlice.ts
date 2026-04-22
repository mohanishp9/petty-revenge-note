import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllNotesAPI } from "@/features/publicNote/publicNoteApi";
import { getAllNotesState, getNotesParams } from "@/features/publicNote/types";
import { addComment } from "@/features/comments/commentsSlice";

// like
import { toggleLikeApi } from "@/features/toggleLike/toggleLikeApi";
import { ToggleLikeParams } from "@/features/toggleLike/types";

// reaction
import { reactionApi } from "@/features/reaction/rectionApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const initialState: getAllNotesState = {
    notes: [],

    loading: false,
    error: null,

    count: 0,
}

// get all notes
export const getAllNotes = createAsyncThunk(
    "/public/notes",
    async (data: getNotesParams, thunkAPI ) => {
        try {
            const res = await getAllNotesAPI(data);
            return res;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const toggleLike = createAsyncThunk(
    "publicNote/toggleLike",
    async (params: ToggleLikeParams, thunkAPI) => {
        try {
            const res = await toggleLikeApi(params);

            return {
                noteId: params.noteId,
                liked: res.liked
            };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

export const reactToNote = createAsyncThunk(
    "publicNote/react",
    async (params: { noteId: string; emoji: string }, thunkAPI) => {
        try {
            const res = await reactionApi(params);

            return {
                noteId: params.noteId,
                reacted: res.reacted,
                emoji: res.emoji, // can be null
            };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const publicNoteSlice = createSlice({
    name: "publicNote",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllNotes.fulfilled, (state, action) => {
                const requestedPage = action.meta.arg.page ?? 1;
                const incomingNotes = action.payload.data;

                state.loading = false;
                state.notes = requestedPage > 1
                    ? [
                        ...state.notes,
                        ...incomingNotes.filter(
                            (incomingNote) => !state.notes.some((existingNote) => existingNote._id === incomingNote._id)
                        ),
                    ]
                    : incomingNotes;
                state.count = action.payload.count;
            })
            .addCase(getAllNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(toggleLike.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                // store previous state (for rollback)
                note._prevHasLiked = note.hasLiked;
                note._prevLikes = note.likes;

                // optimistic update
                if (note.hasLiked) {
                    note.likes = Math.max(0, note.likes - 1);
                } else {
                    note.likes += 1;
                }

                note.hasLiked = !note.hasLiked;
            })
            .addCase(toggleLike.fulfilled, (state, action) => {
                const { noteId, liked } = action.payload;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                note.hasLiked = liked;
            })
            .addCase(toggleLike.rejected, (state, action) => {
                const noteId = action.meta.arg.noteId;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                if (note._prevHasLiked !== undefined) {
                    note.hasLiked = note._prevHasLiked;
                }

                if (note._prevLikes !== undefined) {
                    note.likes = note._prevLikes;
                }
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const note = state.notes.find((currentNote) => currentNote._id === action.payload.noteId);

                if (note) {
                    note.commentsCount += 1;
                }
            })
            .addCase(reactToNote.pending, (state, action) => {
                const { noteId, emoji } = action.meta.arg;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                // store previous state
                note._prevReaction = note.userReaction;
                note._prevReactionsCount = { ...note.reactionsCount };

                const prevEmoji = note.userReaction;

                // REMOVE reaction
                if (prevEmoji === emoji) {
                    if (note.reactionsCount[prevEmoji]) {
                        note.reactionsCount[prevEmoji] -= 1;
                        if (note.reactionsCount[prevEmoji] <= 0) {
                            delete note.reactionsCount[prevEmoji];
                        }
                    }
                    note.userReaction = null;
                    return;
                }

                // CHANGE reaction
                if (prevEmoji && prevEmoji !== emoji) {
                    if (note.reactionsCount[prevEmoji]) {
                        note.reactionsCount[prevEmoji] -= 1;
                        if (note.reactionsCount[prevEmoji] <= 0) {
                            delete note.reactionsCount[prevEmoji];
                        }
                    }
                }

                // ADD reaction
                if (emoji) {
                    note.reactionsCount[emoji] = (note.reactionsCount[emoji] || 0) + 1;
                }

                note.userReaction = emoji;
            })
            .addCase(reactToNote.fulfilled, (state, action) => {
                const { noteId, emoji } = action.payload;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                note.userReaction = emoji;
            })
            .addCase(reactToNote.rejected, (state, action) => {
                const { noteId } = action.meta.arg;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                note.userReaction = note._prevReaction;
                note.reactionsCount = note._prevReactionsCount;
            })
    }
});

export default publicNoteSlice.reducer;
