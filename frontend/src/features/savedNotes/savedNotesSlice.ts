import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toggleSaveAPI, getSavedNotesAPI } from "@/features/savedNotes/savedNotesApi";
import { SavedNotesState } from "@/features/savedNotes/types";
import { getErrorMessage } from "@/utils/getErrorMessage";

const initialState: SavedNotesState = {
    savedNoteIds: {},
    notes: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: false,
    error: null,
};

// Toggle save — returns the new saved state from the backend
export const toggleSave = createAsyncThunk(
    "savedNotes/toggle",
    async (noteId: string, thunkAPI) => {
        try {
            const res = await toggleSaveAPI(noteId);
            return { noteId, saved: res.saved };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// Fetch the paginated list of saved notes
export const getSavedNotes = createAsyncThunk(
    "savedNotes/get",
    async (params: { page: number; limit: number }, thunkAPI) => {
        try {
            const res = await getSavedNotesAPI(params);
            return { ...res, page: params.page };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const savedNotesSlice = createSlice({
    name: "savedNotes",
    initialState,
    reducers: {
        // Called after fetching the feed so NoteCards know which notes are already saved
        setSavedNoteIds(state, action: PayloadAction<string[]>) {
            state.savedNoteIds = action.payload.reduce<Record<string, true>>(
                (acc, id) => { acc[id] = true; return acc; },
                {}
            );
        },
        resetSavedNotes(state) {
            state.notes = [];
            state.page = 1;
            state.total = 0;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // toggleSave
        builder
            .addCase(toggleSave.fulfilled, (state, action) => {
                const { noteId, saved } = action.payload;

                // Update the fast-lookup Record for NoteCard icon state
                if (saved) {
                    state.savedNoteIds[noteId] = true;
                } else {
                    delete state.savedNoteIds[noteId];
                    // If on the saved page, remove it from the list immediately
                    state.notes = state.notes.filter((n) => n._id !== noteId);
                }
            })
            .addCase(toggleSave.rejected, (state, action) => {
                state.error = action.payload as string;
            });

        // getSavedNotes
        builder
            .addCase(getSavedNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSavedNotes.fulfilled, (state, action) => {
                const { data, total, page } = action.payload;

                state.loading = false;

                // Append on paginate, replace on first load
                state.notes =
                    page > 1
                        ? [
                            ...state.notes,
                            ...data.filter((n) => !state.notes.some((e) => e._id === n._id)),
                        ]
                        : data;

                state.page = page;
                state.total = total;

                // Keep the fast-lookup Record in sync with the fetched page
                data.forEach((n) => { state.savedNoteIds[n._id] = true; });
            })
            .addCase(getSavedNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSavedNoteIds, resetSavedNotes } = savedNotesSlice.actions;
export default savedNotesSlice.reducer;
