import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import dashboardReducer from "@/features/dashboard/dashboardSlice";
import usersReducer from "@/features/users/usersSlice";
import notesReducer from "@/features/notes/notesSlice";
import commentsReducer from "@/features/comments/commentsSlice";
import settingsReducer from "@/features/settings/settingsSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        dashboard: dashboardReducer,
        users: usersReducer,
        notes: notesReducer,
        comments: commentsReducer,
        settings: settingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
