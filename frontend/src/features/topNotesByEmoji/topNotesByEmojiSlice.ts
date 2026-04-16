import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTopNoteByEmojiAPI } from "@/features/topNotesByEmoji/topNotesByEmojiApi";
import { GetTopNotesByEmojiState } from "@/features/topNotesByEmoji/types";

const initialState: GetTopNotesByEmojiState = {
    data: [],
    loading: false,
    error: null,
    selectedEmoji: null,
};

export const getTopNotesByEmoji = createAsyncThunk(
    "topNotes/getByEmoji",
    async (emoji: string, thunkAPI) => {
        try {
            const res = await getTopNoteByEmojiAPI(emoji);

            return {
                ...res,
                selectedEmoji: emoji
            };
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch top notes"
            );
        }
    }
);

const topNotesByEmojiSlice = createSlice({
    name: "topNotesByEmoji",
    initialState,
    reducers: {
        clearTopNotesByEmoji(state) {
            state.data = [];
            state.selectedEmoji = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTopNotesByEmoji.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTopNotesByEmoji.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
                state.selectedEmoji = action.payload.selectedEmoji;
            })
            .addCase(getTopNotesByEmoji.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearTopNotesByEmoji } = topNotesByEmojiSlice.actions;
export default topNotesByEmojiSlice.reducer;