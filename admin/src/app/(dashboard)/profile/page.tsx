"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/app/hook/dispatch";
import { changeAdminPassword } from "@/features/auth/authSlice";
import { RootState } from "@/store/store";

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("NEW PASSWORDS DO NOT MATCH", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#ff453a', border: '1px solid #1f1f1f' }
            });
            return;
        }

        setLoading(true);
        const res = await dispatch(changeAdminPassword({ currentPassword, newPassword }));
        
        if (changeAdminPassword.fulfilled.match(res)) {
            toast.success("PASSWORD UPDATED SUCCESSFULLY", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#32d74b', border: '1px solid #1f1f1f' }
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            toast.error(res.payload as string || "OPERATION FAILED", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#ff453a', border: '1px solid #1f1f1f' }
            });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-[var(--color-term-border)] pb-4">
                <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.PROFILE</h1>
                <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">Manage credentials and security.</p>
            </div>

            <div className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-6">
                <div className="mb-8 border-b border-[var(--color-term-border)] pb-6">
                    <h2 className="text-sm font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase mb-4">Current Operator</h2>
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="w-32 text-xs font-mono text-[var(--color-term-text-secondary)]">NAME:</span>
                            <span className="text-xs font-mono text-white uppercase">{user?.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 text-xs font-mono text-[var(--color-term-text-secondary)]">EMAIL:</span>
                            <span className="text-xs font-mono text-[var(--color-term-accent-cyan)]">{user?.email}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 text-xs font-mono text-[var(--color-term-text-secondary)]">CLEARANCE:</span>
                            <span className="text-xs font-mono text-[var(--color-term-status-green)] uppercase">
                                {user?.isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-sm font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase">Change Password</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-[var(--color-term-text-secondary)] mb-1" htmlFor="currentPassword">
                                CURRENT PASSWORD
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-mono text-[var(--color-term-text-secondary)] mb-1" htmlFor="newPassword">
                                NEW PASSWORD
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-[var(--color-term-text-secondary)] mb-1" htmlFor="confirmPassword">
                                CONFIRM NEW PASSWORD
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center bg-[#050505] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111] transition-all disabled:opacity-50 border-pulse"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <span className="font-mono text-xs tracking-widest uppercase group-hover:text-pulse-gradient">Execute Change</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
