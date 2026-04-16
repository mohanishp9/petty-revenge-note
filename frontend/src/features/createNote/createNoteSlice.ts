import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createNoteAPI } from "./createNoteApi";
import { CreateNoteParams, CreateNoteState } from "./types";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const initialState: CreateNoteState = {
    loading: false,
    error: null,
    success: false,
};

export const createNote = createAsyncThunk(
    "createNote/create",
    async (data: CreateNoteParams, thunkAPI) => {
        try {
            const res = await createNoteAPI(data);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

const createNoteSlice = createSlice({
    name: "createNote",
    initialState,
    reducers: {
        resetCreateNote(state) {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createNote.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createNote.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(createNote.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetCreateNote } = createNoteSlice.actions;
export default createNoteSlice.reducer;