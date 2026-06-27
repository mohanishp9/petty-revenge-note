import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteNoteAPI } from "./deleteNoteApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface DeleteNoteState {
    loading: boolean;
    error: string | null;
    deletedNoteId: string | null;
}

const initialState: DeleteNoteState = {
    loading: false,
    error: null,
    deletedNoteId: null,
};

export const deleteNote = createAsyncThunk(
    "deleteNote/deleteNote",
    async (noteId: string, thunkAPI) => {
        try {
            const res = await deleteNoteAPI(noteId);
            return { noteId: noteId, result: res };
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const deleteNoteSlice = createSlice({
    name: "deleteNote",
    initialState,
    reducers: {
        resetDeleteNote(state) {
            state.loading = false;
            state.error = null;
            state.deletedNoteId = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(deleteNote.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.deletedNoteId = action.meta.arg;
            })
            .addCase(deleteNote.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetDeleteNote } = deleteNoteSlice.actions;
export default deleteNoteSlice.reducer;