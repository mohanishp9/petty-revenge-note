"use client";

import { useSelector } from "react-redux";
import { useAppDispatch } from "@/app/hook/dispatch";
import { logoutAdmin } from "@/features/auth/authSlice";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";

export default function Topbar() {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutAdmin());
        toast.success("Connection terminated.", {
            style: { borderRadius: '0px', background: '#0a0a0a', color: '#fff', border: '1px solid #1f1f1f' }
        });
    };

    return (
        <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-term-border)] bg-[var(--color-term-surface)] px-6">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center">
                    <span className="text-xs font-mono text-[var(--color-term-text-secondary)]">SYS.STATUS: <span className="text-[var(--color-term-status-green)]">ONLINE</span></span>
                </div>
                
                <div className="flex items-center gap-x-6">
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[var(--color-term-border)]" aria-hidden="true" />
                    
                    <div className="flex items-center gap-x-4">
                        <span className="hidden lg:flex lg:items-center text-xs font-mono tracking-wider text-[var(--color-term-text-primary)] uppercase">
                            USR: {user?.name || "ADMIN"}
                        </span>
                        
                        <button
                            onClick={handleLogout}
                            className="text-xs font-mono text-[var(--color-term-status-red)] hover:text-red-400 transition-colors uppercase tracking-widest ml-4"
                            title="Disconnect"
                        >
                            [EXIT]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
