"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchSystemSettings, updateSystemSettings } from "@/features/settings/settingsSlice";

export function SystemControls() {
    const dispatch = useAppDispatch();
    const { settings, loading } = useSelector((state: RootState) => state.settings);

    useEffect(() => {
        dispatch(fetchSystemSettings());
    }, [dispatch]);

    if (!settings) {
        return (
            <div className="flex h-48 items-center justify-center border border-[var(--color-term-border)] bg-[var(--color-term-surface)]">
                <span className="text-xs font-mono text-[var(--color-term-text-secondary)] uppercase tracking-widest">
                    LOADING SYSTEM CONTROLS...
                </span>
            </div>
        );
    }

    const handleMaintenanceToggle = () => {
        dispatch(updateSystemSettings({ maintenanceMode: !settings.maintenanceMode }));
    };

    const handleSignupsToggle = () => {
        dispatch(updateSystemSettings({ disableSignups: !settings.disableSignups }));
    };

    return (
        <div className="relative border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-6 group">
            <div className="mb-6 border-b border-[var(--color-term-border)] pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-mono tracking-widest text-white uppercase">
                        SYS.CONTROLS
                    </h2>
                    <p className="text-[10px] font-mono text-[var(--color-term-text-secondary)] mt-1 tracking-widest uppercase">
                        Global administrative overrides.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between border border-[var(--color-term-border)] p-4 bg-[#050505]">
                    <div>
                        <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${settings.maintenanceMode ? 'text-[var(--color-term-status-red)]' : 'text-white'}`}>
                            Maintenance Mode
                        </h3>
                        <p className="text-[10px] font-mono text-[var(--color-term-text-secondary)] mt-1 uppercase tracking-widest">
                            Locks out all public traffic.
                        </p>
                    </div>
                    <button
                        onClick={handleMaintenanceToggle}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center border ${settings.maintenanceMode ? 'border-[var(--color-term-status-red)]' : 'border-[var(--color-term-border)]'} transition-colors focus:outline-none disabled:opacity-50`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                                settings.maintenanceMode ? "translate-x-6 bg-[var(--color-term-status-red)]" : "translate-x-1 bg-[var(--color-term-text-secondary)]"
                            }`}
                        />
                    </button>
                </div>

                {/* Disable Signups Toggle */}
                <div className="flex items-center justify-between border border-[var(--color-term-border)] p-4 bg-[#050505]">
                    <div>
                        <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${settings.disableSignups ? 'text-[var(--color-term-status-red)]' : 'text-white'}`}>
                            Disable New Signups
                        </h3>
                        <p className="text-[10px] font-mono text-[var(--color-term-text-secondary)] mt-1 uppercase tracking-widest">
                            Prevents new user registration.
                        </p>
                    </div>
                    <button
                        onClick={handleSignupsToggle}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center border ${settings.disableSignups ? 'border-[var(--color-term-status-red)]' : 'border-[var(--color-term-border)]'} transition-colors focus:outline-none disabled:opacity-50`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                                settings.disableSignups ? "translate-x-6 bg-[var(--color-term-status-red)]" : "translate-x-1 bg-[var(--color-term-text-secondary)]"
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
