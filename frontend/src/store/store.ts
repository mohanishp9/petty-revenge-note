import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import publicNoteReducer from "@/features/publicNote/publicNoteSlice";
import commentsReducer from "@/features/comments/commentsSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        publicNote: publicNoteReducer,
        comments: commentsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
