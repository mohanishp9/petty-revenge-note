import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllNotesAPI } from "@/features/publicNote/publicNoteApi";
import { getAllNotesState, getNotesParams } from "@/features/publicNote/types";
import { addComment } from "@/features/comments/commentsSlice";

// like
import { toggleLikeApi } from "@/features/toggleLike/toggleLikeApi";
import { ToggleLikeParams } from "@/features/toggleLike/types";

// reaction
import { reactionApi } from "@/features/reaction/rectionApi";

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
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch notes"
            );
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
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to toggle like"
            );
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
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Reaction failed"
            );
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
            .addCase(getAllNotes.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(toggleLike.fulfilled, (state, action) => {
                const { noteId, liked } = action.payload;

                const note = state.notes.find(n => n._id === noteId);

                if (note) {
                    // only update if state actually changed
                    if (note.hasLiked !== liked) {
                        note.likes = liked
                            ? note.likes + 1
                            : Math.max(0, note.likes - 1);
                    }

                    note.hasLiked = liked;
                }
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const note = state.notes.find((currentNote) => currentNote._id === action.payload.noteId);

                if (note) {
                    note.commentsCount += 1;
                }
            })
            .addCase(reactToNote.fulfilled, (state, action) => {
                const { noteId, reacted, emoji } = action.payload;

                const note = state.notes.find(n => n._id === noteId);
                if (!note) return;

                const prevEmoji = note.userReaction;

                // CASE 1: REMOVE REACTION
                if (!reacted) {
                    if (prevEmoji && note.reactionsCount[prevEmoji] !== undefined) {
                        note.reactionsCount[prevEmoji] -= 1;

                        if (note.reactionsCount[prevEmoji] <= 0) {
                            delete note.reactionsCount[prevEmoji];
                        }
                    }

                    note.userReaction = null;
                    return;
                }

                // CASE 2: CHANGE REACTION
                if (prevEmoji && prevEmoji !== emoji) {
                    if (note.reactionsCount[prevEmoji] !== undefined) {
                        note.reactionsCount[prevEmoji] -= 1;

                        if (note.reactionsCount[prevEmoji] <= 0) {
                            delete note.reactionsCount[prevEmoji];
                        }
                    }
                }

                // CASE 3: ADD / NEW REACTION
                if (emoji && prevEmoji !== emoji) {
                    note.reactionsCount[emoji] = (note.reactionsCount[emoji] || 0) + 1;
                }

                note.userReaction = emoji;
            });
    }
});

export default publicNoteSlice.reducer;
