import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyNotesAPI } from "@/features/getMyNotes/getMyNotesApi";
import { GetMyNotesState } from "@/features/getMyNotes/types";

const initialState: GetMyNotesState = {
    notes: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: false,
    error: null,
};

export const getMyNotes = createAsyncThunk(
    "myNotes/get",
    async (
        params: { page: number; limit: number },
        thunkAPI
    ) => {
        try {
            const res = await getMyNotesAPI(params);

            return {
                ...res,
                page: params.page,
            };
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Failed to fetch notes"
            );
        }
    }
);

const getMyNotesSlice = createSlice({
    name: "myNotes",
    initialState,
    reducers: {
        resetMyNotes(state) {
            state.notes = [];
            state.page = 1;
            state.total = 0;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyNotes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getMyNotes.fulfilled, (state, action) => {
                const { data, total, page } = action.payload;

                state.loading = false;

                state.notes =
                    page > 1
                        ? [
                            ...state.notes,
                            ...data.filter(
                                (n) =>
                                    !state.notes.some(
                                        (e) => e._id === n._id
                                    )
                            ),
                        ]
                        : data;

                state.page = page;
                state.total = total;
            })

            .addCase(getMyNotes.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetMyNotes } = getMyNotesSlice.actions;
export default getMyNotesSlice.reducer;