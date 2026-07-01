"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShieldUser } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/app/hook/dispatch";
import { clearError, logoutUser } from "@/features/auth/authSlice";
import type { RootState } from "@/store/store";

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-special-elite), monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "6px 14px",
    borderRadius: 2,
    border: `1px solid ${isActive ? "rgba(120,80,20,0.35)" : "transparent"}`,
    background: isActive ? "rgba(120,80,20,0.14)" : "transparent",
    color: isActive ? "#2c1a06" : "#6a4515",
    transition: "all 0.15s",
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
});

const Navbar = () => {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const router = useRouter();
    const { accessToken, loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (error) {
            const msg = typeof error === "string" ? error : error.message;
            toast.error(msg);
            dispatch(clearError());
        }
    }, [dispatch, error]);

    const isLoggedIn = Boolean(accessToken);

    const handleLogout = async () => {
        const action = await dispatch(logoutUser());
        if (logoutUser.fulfilled.match(action)) {
            toast.success("Logged out");
            router.push("/login");
            router.refresh();
        }
    };

    return (
        <header
            className="sticky top-0 z-40"
            style={{
                backgroundImage: `
          repeating-linear-gradient(180deg, transparent, transparent 19px, rgba(100,60,10,0.08) 19px, rgba(100,60,10,0.08) 20px),
          linear-gradient(135deg, #f0dda0 0%, #f5e9c8 50%, #ede0b4 100%)
        `,
                borderBottom: "1px solid rgba(120,80,20,0.25)",
                boxShadow: "0 2px 12px rgba(80,40,0,0.1)",
            }}
        >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6" style={{ height: 64 }}>

                {/* Logo */}
                <Link href="/home" className="flex items-center gap-2.5 no-underline hover:opacity-90 transition-opacity">
                    <Image
                        src="/Petty_Revenge_Note.webp"
                        alt="Petty Revenge Notes Logo"
                        width={140}
                        height={45}
                        style={{ height: '42px', width: 'auto' }}
                        className="object-contain"
                        priority
                    />
                </Link>

                {/* Nav links */}
                <nav
                    className="flex items-center gap-1"
                    style={{
                        background: "rgba(240,220,160,0.5)",
                        border: "1px solid rgba(120,80,20,0.2)",
                        borderRadius: 2,
                        padding: 5,
                    }}
                >
                    <Link href="/home" style={navLinkStyle(pathname === "/home" || pathname === "/")}>
                        Home
                    </Link>

                    {!isLoggedIn && (
                        <>
                            <div style={{ width: 1, height: 18, background: "rgba(120,80,20,0.2)", margin: "0 2px" }} />
                            <Link href="/login" style={navLinkStyle(pathname === "/login")}>
                                Login
                            </Link>
                            <Link href="/register" style={navLinkStyle(pathname === "/register")}>
                                Sign Up
                            </Link>
                        </>
                    )}

                    {isLoggedIn && (
                        <>
                            <div style={{ width: 1, height: 18, background: "rgba(120,80,20,0.2)", margin: "0 2px" }} />
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loading}
                                style={{
                                    ...navLinkStyle(false),
                                    opacity: loading ? 0.6 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                }}
                            >
                                <LogOut style={{ width: 12, height: 12 }} />
                                Logout
                            </button>
                        </>
                    )}
                </nav>

                <div className="flex gap-2">
                    {/* Settings button (only if logged in) */}
                    {isLoggedIn && (
                        <Link
                            href="/settings"
                            aria-label="Settings"
                            className="flex items-center justify-center transition"
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 3,
                                background: "rgba(240,220,160,0.5)",
                                border: "1px solid rgba(120,80,20,0.25)",
                                color: "#6a4515",
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = "rgba(120,80,20,0.1)";
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(120,80,20,0.4)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = "rgba(240,220,160,0.5)";
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(120,80,20,0.25)";
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>
                    )}

                    {/* Profile button */}
                    <Link
                        href="/profile"
                        aria-label="Profile"
                        className="flex items-center justify-center transition"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 3,
                            background: "rgba(240,220,160,0.5)",
                            border: "1px solid rgba(120,80,20,0.25)",
                            color: "#6a4515",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(120,80,20,0.1)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(120,80,20,0.4)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(240,220,160,0.5)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(120,80,20,0.25)";
                        }}
                    >
                        <ShieldUser style={{ width: 18, height: 18 }} />
                    </Link>
                </div>

            </div>
        </header>
    );
};

export default Navbar;
