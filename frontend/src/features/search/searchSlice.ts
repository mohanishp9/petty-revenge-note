import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Note } from "@/features/publicNote/types";
import { searchNotesAPI } from "./searchApi";
import { toggleLike, reactToNote } from "@/features/publicNote/publicNoteSlice";
import { toggleSave } from "@/features/savedNotes/savedNotesSlice";
import { addComment, deleteComment } from "@/features/comments/commentsSlice";

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
      })
      .addCase(toggleLike.pending, (state, action) => {
        const noteId = action.meta.arg.noteId;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note._prevHasLiked = note.hasLiked;
        note._prevLikes = note.likes;
        if (note.hasLiked) {
          note.likes = Math.max(0, note.likes - 1);
        } else {
          note.likes += 1;
        }
        note.hasLiked = !note.hasLiked;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { noteId, liked } = action.payload;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note.hasLiked = liked;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const noteId = action.meta.arg.noteId;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        if (note._prevHasLiked !== undefined) note.hasLiked = note._prevHasLiked;
        if (note._prevLikes !== undefined) note.likes = note._prevLikes;
      })
      .addCase(reactToNote.pending, (state, action) => {
        const { noteId, emoji } = action.meta.arg;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note._prevReaction = note.userReaction;
        note._prevReactionsCount = { ...note.reactionsCount };
        const prevEmoji = note.userReaction;
        if (prevEmoji === emoji) {
          if (note.reactionsCount[prevEmoji]) {
            note.reactionsCount[prevEmoji] -= 1;
            if (note.reactionsCount[prevEmoji] <= 0) delete note.reactionsCount[prevEmoji];
          }
          note.userReaction = null;
          return;
        }
        if (prevEmoji && prevEmoji !== emoji) {
          if (note.reactionsCount[prevEmoji]) {
            note.reactionsCount[prevEmoji] -= 1;
            if (note.reactionsCount[prevEmoji] <= 0) delete note.reactionsCount[prevEmoji];
          }
        }
        if (emoji) {
          note.reactionsCount[emoji] = (note.reactionsCount[emoji] || 0) + 1;
        }
        note.userReaction = emoji;
      })
      .addCase(reactToNote.fulfilled, (state, action) => {
        const { noteId, emoji } = action.payload;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note.userReaction = emoji;
      })
      .addCase(reactToNote.rejected, (state, action) => {
        const { noteId } = action.meta.arg;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note.userReaction = note._prevReaction;
        note.reactionsCount = note._prevReactionsCount;
      })
      .addCase(toggleSave.pending, (state, action) => {
        const noteId = action.meta.arg;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        note._prevSavesCount = note.savesCount;
        note._prevIsSaved = note.isSaved;
        const currentlySaved = note.isSaved;
        note.savesCount = Math.max(0, (note.savesCount || 0) + (currentlySaved ? -1 : 1));
        note.isSaved = !currentlySaved;
      })
      .addCase(toggleSave.fulfilled, (state, action) => {
        const { noteId, saved } = action.payload;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        const base = note._prevSavesCount !== undefined ? note._prevSavesCount : 0;
        note.savesCount = saved ? base + 1 : Math.max(0, base - 1);
        note.isSaved = saved;
      })
      .addCase(toggleSave.rejected, (state, action) => {
        const noteId = action.meta.arg;
        const note = state.results.find((n) => n._id === noteId);
        if (!note) return;
        if (note._prevIsSaved !== undefined) note.isSaved = note._prevIsSaved;
        if (note._prevSavesCount !== undefined) note.savesCount = note._prevSavesCount;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const note = state.results.find((n) => n._id === action.payload.noteId);
        if (note) note.commentsCount += 1;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { noteId, removedCount } = action.payload as { noteId?: string; removedCount: number };
        if (!noteId) return;
        const note = state.results.find((n) => n._id === noteId);
        if (note) note.commentsCount = Math.max(0, note.commentsCount - (removedCount || 1));
      });
  },
});

export const { clearSearch, setSearchQuery } = searchSlice.actions;
export default searchSlice.reducer;
