import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTopNoteByEmojiAPI } from "@/features/topNotesByEmoji/topNotesByEmojiApi";
import { GetTopNotesByEmojiState } from "@/features/topNotesByEmoji/types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { toggleLike, reactToNote } from "@/features/publicNote/publicNoteSlice";
import { toggleSave } from "@/features/savedNotes/savedNotesSlice";
import { addComment, deleteComment } from "@/features/comments/commentsSlice";

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
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
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
            .addCase(getTopNotesByEmoji.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(toggleLike.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
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
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                note.hasLiked = liked;
            })
            .addCase(toggleLike.rejected, (state, action) => {
                const noteId = action.meta.arg.noteId;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                if (note._prevHasLiked !== undefined) note.hasLiked = note._prevHasLiked;
                if (note._prevLikes !== undefined) note.likes = note._prevLikes;
            })
            .addCase(reactToNote.pending, (state, action) => {
                const { noteId, emoji } = action.meta.arg;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
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
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                note.userReaction = emoji;
            })
            .addCase(reactToNote.rejected, (state, action) => {
                const { noteId } = action.meta.arg;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                note.userReaction = note._prevReaction;
                note.reactionsCount = note._prevReactionsCount;
            })
            .addCase(toggleSave.pending, (state, action) => {
                const noteId = action.meta.arg;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                note._prevSavesCount = note.savesCount;
                note._prevIsSaved = note.isSaved;
                const currentlySaved = note.isSaved;
                note.savesCount = Math.max(0, (note.savesCount || 0) + (currentlySaved ? -1 : 1));
                note.isSaved = !currentlySaved;
            })
            .addCase(toggleSave.fulfilled, (state, action) => {
                const { noteId, saved } = action.payload;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                const base = note._prevSavesCount !== undefined ? note._prevSavesCount : 0;
                note.savesCount = saved ? base + 1 : Math.max(0, base - 1);
                note.isSaved = saved;
            })
            .addCase(toggleSave.rejected, (state, action) => {
                const noteId = action.meta.arg;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (!note) return;
                if (note._prevIsSaved !== undefined) note.isSaved = note._prevIsSaved;
                if (note._prevSavesCount !== undefined) note.savesCount = note._prevSavesCount;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const note = state.data.find((d) => d.note._id === action.payload.noteId)?.note;
                if (note) note.commentsCount += 1;
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                const { noteId, removedCount } = action.payload as { noteId?: string; removedCount: number };
                if (!noteId) return;
                const note = state.data.find((d) => d.note._id === noteId)?.note;
                if (note) note.commentsCount = Math.max(0, note.commentsCount - (removedCount || 1));
            });
    },
});

export const { clearTopNotesByEmoji } = topNotesByEmojiSlice.actions;
export default topNotesByEmojiSlice.reducer;