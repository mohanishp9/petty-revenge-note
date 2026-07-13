"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function FloatingCompose() {
    const router = useRouter();
    const { accessToken } = useSelector((state: RootState) => state.auth);
    const isLoggedIn = Boolean(accessToken);

    const handleClick = () => {
        if (!isLoggedIn) {
            router.push("/login?redirect=/profile?compose=true");
        } else {
            router.push("/profile?compose=true");
        }
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
                background: "linear-gradient(135deg, #7a5020 0%, #4a2808 100%)",
                border: "2px solid rgba(240,220,160,0.8)",
                boxShadow: "0 8px 32px rgba(80,40,10,0.35)",
            }}
            title="Compose New Entry"
        >
            <PenLine className="h-6 w-6 text-[#f5e9c8]" />
        </button>
    );
}
