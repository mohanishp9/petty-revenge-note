"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isInitialized } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!isInitialized) return;

        if (!user || !user.isSuperAdmin) {
            router.replace("/login");
        }
    }, [user, isInitialized, router]);

    if (!isInitialized || !user || !user.isSuperAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="font-mono text-sm">Verifying admin clearance...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
