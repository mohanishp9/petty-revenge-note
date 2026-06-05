"use client";

import { Provider, useSelector } from "react-redux";
import { store } from "@/store/store";
import React, { useEffect } from "react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { refreshToken, getCurrentUser } from "@/features/auth/authSlice";
import { setAccessToken } from "@/lib/axios";
import type { RootState } from "@/store/store";

function SessionRestorer() {
    const dispatch = useAppDispatch();
    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(refreshToken());
    }, [dispatch]);

    useEffect(() => {
        setAccessToken(accessToken ?? null);
    }, [accessToken]);

    useEffect(() => {
        if (accessToken && !user) {
            dispatch(getCurrentUser());
        }
    }, [accessToken, user, dispatch]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <SessionRestorer />
            {children}
        </Provider>
    );
}