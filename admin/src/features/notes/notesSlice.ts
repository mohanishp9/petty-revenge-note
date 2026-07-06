import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/getErrorMessage";

export interface ModerationNote {
    _id: string;
    subject: string;
    content: string;
    createdAt: string;
    user: {
        _id: string;
        username: string;
        email: string;
    };
    reportsCount?: number;
}

interface FetchNotesResponse {
    notes: ModerationNote[];
    total: number;
    page: number;
    pages: number;
}

export interface NotesState {
    notes: ModerationNote[];
    total: number;
    page: number;
    pages: number;
    loading: boolean;
    error: string | null;
}

const initialState: NotesState = {
    notes: [],
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
};

export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async ({ page = 1, search = "" }: { page?: number; search?: string }, thunkAPI) => {
        try {
            const res = await api.get(`/notes?page=${page}&search=${search}`);
            return res.data as FetchNotesResponse;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

export const deleteNoteAdmin = createAsyncThunk(
    "notes/deleteNoteAdmin",
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/notes/${id}`);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(getErrorMessage(error));
        }
    }
);

const notesSlice = createSlice({
    name: "notes",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Notes
            .addCase(fetchNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.loading = false;
                state.notes = action.payload.notes;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Delete Note
            .addCase(deleteNoteAdmin.fulfilled, (state, action) => {
                state.notes = state.notes.filter(n => n._id !== action.payload);
                state.total -= 1;
            });
    }
});

export default notesSlice.reducer;
