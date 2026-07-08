import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllNotesAPI } from "@/features/publicNote/publicNoteApi";
import { deleteComment } from "@/features/comments/commentsSlice";
import { getAllNotesState, getNotesParams } from "@/features/publicNote/types";
import { addComment } from "@/features/comments/commentsSlice";

// like
import { toggleLikeApi } from "@/features/toggleLike/toggleLikeApi";
import { ToggleLikeParams } from "@/features/toggleLike/types";

// reaction
import { reactionApi } from "@/features/reaction/rectionApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

// save — imported lazily to avoid circular dep; we only use the action type
import { toggleSave } from "@/features/savedNotes/savedNotesSlice";

export const initialState: getAllNotesState = {
    notes: [],

    loading: false,
    error: null,

    count: 0,
    nextCursor: null,
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
    reducers: {
        addSingleNote: (state, action) => {
            const incomingNote = action.payload;
            const exists = state.notes.some(n => n._id === incomingNote._id);
            if (!exists) {
                state.notes.push(incomingNote);
            } else {
                state.notes = state.notes.map(n => n._id === incomingNote._id ? incomingNote : n);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllNotes.fulfilled, (state, action) => {
                const requestedPage = action.meta.arg.page ?? 1;
                const requestedCursor = action.meta.arg.cursor;
                const incomingNotes = action.payload.data;

                state.loading = false;
                state.notes = (requestedPage > 1 || requestedCursor)
                    ? [
                        ...state.notes,
                        ...incomingNotes.filter(
                            (incomingNote) => !state.notes.some((existingNote) => existingNote._id === incomingNote._id)
                        ),
                    ]
                    : incomingNotes;
                state.count = action.payload.count;
                state.nextCursor = action.payload.nextCursor;
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
            .addCase(deleteComment.fulfilled, (state, action) => {
                const { noteId, removedCount } = action.payload as { noteId?: string; removedCount: number };
                if (!noteId) return;

                const note = state.notes.find((n) => n._id === noteId);
                if (!note) return;

                note.commentsCount = Math.max(0, note.commentsCount - (removedCount || 1));
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
            // ── Save optimistic updates (mirrors toggleLike pattern) ──
            .addCase(toggleSave.pending, (state, action) => {
                const noteId = action.meta.arg;
                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                note._prevSavesCount = note.savesCount;
                note._prevIsSaved = note.isSaved;

                // Determine current saved state from the action's optimistic direction
                // We don't have savedNoteIds here, so we mirror the counter direction
                // The fulfilled case will reconcile with the server value
                const currentlySaved = note.isSaved;
                note.savesCount = Math.max(0, (note.savesCount || 0) + (currentlySaved ? -1 : 1));
                note.isSaved = !currentlySaved;
            })
            .addCase(toggleSave.fulfilled, (state, action) => {
                const { noteId, saved } = action.payload;
                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                // Use the prev value + server truth to set correct counter. If undefined, it was 0.
                const base = note._prevSavesCount !== undefined ? note._prevSavesCount : 0;
                note.savesCount = saved ? base + 1 : Math.max(0, base - 1);
                note.isSaved = saved;
            })
            .addCase(toggleSave.rejected, (state, action) => {
                const noteId = action.meta.arg;
                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                if (note._prevSavesCount !== undefined) {
                    note.savesCount = note._prevSavesCount;
                }
                if (note._prevIsSaved !== undefined) {
                    note.isSaved = note._prevIsSaved;
                }
            })
    }
});

export const { addSingleNote } = publicNoteSlice.actions;
export default publicNoteSlice.reducer;
