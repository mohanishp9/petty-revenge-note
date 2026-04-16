"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShieldUser } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/app/hook/dispatch";
import { clearError, logoutUser, setUserFromStorage } from "@/features/auth/authSlice";
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
    const { token, loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => { dispatch(setUserFromStorage()); }, [dispatch]);

    useEffect(() => {
        if (error) { toast.error(error); dispatch(clearError()); }
    }, [dispatch, error]);

    const isLoggedIn = Boolean(token);

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
                <Link href="/home" className="flex items-center gap-2.5 no-underline">
                    <div
                        className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center"
                        style={{
                            background: "#2c1a06",
                            borderRadius: 3,
                            border: "1px solid rgba(200,160,80,0.4)",
                            fontFamily: "var(--font-special-elite), monospace",
                            fontSize: 11,
                            letterSpacing: "0.1em",
                            color: "#f0dda0",
                        }}
                    >
                        PR
                    </div>
                    <div>
                        <p
                            style={{
                                fontFamily: "var(--font-special-elite), monospace",
                                fontSize: 9,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "#8a6030",
                            }}
                        >
                            Petty Revenge
                        </p>
                        <p
                            style={{
                                fontFamily: "var(--font-im-fell), serif",
                                fontSize: 17,
                                color: "#2c1a06",
                                fontStyle: "italic",
                                lineHeight: 1.1,
                            }}
                        >
                            Notes
                        </p>
                    </div>
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
        </header>
    );
};

export default Navbar;
