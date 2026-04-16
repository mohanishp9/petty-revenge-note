import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import publicNoteReducer from "@/features/publicNote/publicNoteSlice";
import commentsReducer from "@/features/comments/commentsSlice";
import createNoteReducer from "@/features/createNote/createNoteSlice";
import getMyNoteReducer from "@/features/getMyNotes/getMyNotesSlice"
import topNotesByEmojiSliceReducer from "@/features/topNotesByEmoji/topNotesByEmojiSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        publicNote: publicNoteReducer,
        comments: commentsReducer,
        createNote: createNoteReducer,
        getMyNote: getMyNoteReducer,
        getTopNotesByEmoji: topNotesByEmojiSliceReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
