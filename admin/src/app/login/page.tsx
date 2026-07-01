"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { loginAdmin } from "@/features/auth/authSlice";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, loading, error, isInitialized } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (isInitialized && user?.isSuperAdmin) {
            router.replace("/");
        }
    }, [user, isInitialized, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await dispatch(loginAdmin({ email, password }));
        if (loginAdmin.fulfilled.match(res)) {
            toast.success("Authentication successful.", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#fff', border: '1px solid #1f1f1f' }
            });
            router.push("/");
        } else {
            toast.error(res.payload as string || "Access denied.", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#ff453a', border: '1px solid #1f1f1f' }
            });
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-term-bg)] px-4">
            <div className="w-full max-w-sm bg-[var(--color-term-surface)] p-8 border border-[var(--color-term-border)]">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold tracking-tight text-white uppercase">SYS.AUTH</h2>
                    <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)]">
                        Identify to access terminal
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="sr-only" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 px-3 text-white font-mono text-sm placeholder-[var(--color-term-text-secondary)] focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                                placeholder="root@system"
                            />
                        </div>
                        <div>
                            <label className="sr-only" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 px-3 text-white font-mono text-sm placeholder-[var(--color-term-text-secondary)] focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                                placeholder="********"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="border border-[var(--color-term-status-red)] bg-[#1a0505] p-2 text-xs font-mono text-[var(--color-term-status-red)]">
                            ERR: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center bg-[#050505] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111] transition-all disabled:opacity-50 border-pulse"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <span className="font-mono text-xs tracking-widest uppercase group-hover:text-pulse-gradient">Execute</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
