import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Note } from "@/features/publicNote/types";
import { searchNotesAPI } from "./searchApi";

interface SearchState {
  query: string;
  results: Note[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

const initialState: SearchState = {
  query: "",
  results: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  hasMore: false,
};

export const searchNotes = createAsyncThunk(
  "search/searchNotes",
  async ({ query, page }: { query: string; page: number }, { rejectWithValue, signal }) => {
    try {
      const response = await searchNotesAPI(query, page, signal);
      return { query, page, data: response };
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
        return rejectWithValue('aborted');
      }
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message || "Failed to search notes"
      );
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.query = "";
      state.results = [];
      state.total = 0;
      state.page = 1;
      state.loading = false;
      state.error = null;
      state.hasMore = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchNotes.fulfilled, (state, action) => {
        state.loading = false;
        const { query, page, data } = action.payload;
        
        // Safety check to prevent stale state from an old query overwriting the UI
        if (state.query !== query) return;

        state.total = data.total;
        
        if (page === 1) {
          state.results = data.data;
        } else {
          state.results = [...state.results, ...data.data];
        }
        
        state.page = page;
        state.hasMore = state.results.length < data.total;
      })
      .addCase(searchNotes.rejected, (state, action) => {
        if (action.payload === 'aborted') {
          // Do not change state on abort, let the newer request handle it
          return;
        }
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSearch, setSearchQuery } = searchSlice.actions;
export default searchSlice.reducer;
