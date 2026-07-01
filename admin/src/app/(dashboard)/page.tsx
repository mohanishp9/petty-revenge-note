"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchDashboardStats } from "@/features/dashboard/dashboardSlice";
import { RootState } from "@/store/store";
import { Users, FileText, MessageSquare, Heart, RefreshCcw } from "lucide-react";
import { AnalyticsChart } from "@/components/ui/AnalyticsChart";

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const { stats, chartData, loading, error } = useSelector((state: RootState) => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchDashboardStats());
    };

    const cards = [
        { name: "TOTAL USERS", value: stats?.users ?? 0, icon: Users },
        { name: "TOTAL NOTES", value: stats?.notes ?? 0, icon: FileText },
        { name: "TOTAL COMMENTS", value: stats?.comments ?? 0, icon: MessageSquare },
        { name: "TOTAL REACTIONS", value: stats?.reactions ?? 0, icon: Heart },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.OVERVIEW</h1>
                    <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)]">Platform metrics telemetry.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="group flex items-center gap-2 border border-[var(--color-term-border)] bg-[var(--color-term-surface)] px-3 py-1.5 hover:bg-[#111] transition-colors disabled:opacity-50"
                >
                    <RefreshCcw className={`h-3 w-3 text-[var(--color-term-accent-cyan)] ${loading ? "animate-spin" : ""}`} />
                    <span className="text-xs font-mono text-white uppercase tracking-widest group-hover:text-pulse-gradient">Sync</span>
                </button>
            </div>

            {error && (
                <div className="border border-[var(--color-term-status-red)] bg-[#1a0505] p-3 text-xs font-mono text-[var(--color-term-status-red)] uppercase">
                    ERR: {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.name}
                            className="group relative overflow-hidden border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-5 transition-all hover:border-[var(--color-term-accent-cyan)]"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Icon className="h-24 w-24 text-[var(--color-term-text-secondary)]" />
                            </div>
                            
                            <div className="relative z-10">
                                <p className="text-xs font-mono tracking-widest text-[var(--color-term-text-secondary)]">{card.name}</p>
                                <p className="mt-4 text-4xl font-mono text-white">
                                    {loading && !stats ? (
                                        <span className="text-[var(--color-term-text-secondary)] animate-pulse">----</span>
                                    ) : (
                                        card.value.toLocaleString()
                                    )}
                                </p>
                            </div>
                            
                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-pulse-gradient transition-all duration-300 group-hover:w-full" />
                        </div>
                    );
                })}
            </div>

            <div className="mt-8">
                <AnalyticsChart data={chartData} />
            </div>
        </div>
    );
}
