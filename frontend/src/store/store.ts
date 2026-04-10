import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import publicNoteReducer from "@/features/publicNote/publicNoteSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        publicNote: publicNoteReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;