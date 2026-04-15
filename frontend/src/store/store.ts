import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import publicNoteReducer from "@/features/publicNote/publicNoteSlice";
import commentsReducer from "@/features/comments/commentsSlice";
import createNoteReducer from "@/features/createNote/createNoteSlice";
import getMyNoteReducer from "@/features/getMyNotes/getMyNotesSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        publicNote: publicNoteReducer,
        comments: commentsReducer,
        createNote: createNoteReducer,
        getMyNote: getMyNoteReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
