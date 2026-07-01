"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchUserById, toggleUserBan, deleteUser, clearSelectedUser } from "@/features/users/usersSlice";
import { RootState } from "@/store/store";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    
    const { selectedUser, loading, error } = useSelector((state: RootState) => state.users);
    
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (params.id) {
            dispatch(fetchUserById(params.id as string));
        }
        return () => {
            dispatch(clearSelectedUser());
        };
    }, [dispatch, params.id]);

    const handleToggleBan = async () => {
        if (!selectedUser) return;
        const res = await dispatch(toggleUserBan(selectedUser._id));
        if (toggleUserBan.fulfilled.match(res)) {
            toast.success(res.payload.isBanned ? "ENTITY BANNED" : "ENTITY RESTORED", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: res.payload.isBanned ? '#ff453a' : '#32d74b', border: '1px solid #1f1f1f' }
            });
            setIsBanModalOpen(false);
        } else {
            toast.error(res.payload as string || "OPERATION FAILED");
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        const res = await dispatch(deleteUser(selectedUser._id));
        if (deleteUser.fulfilled.match(res)) {
            toast.success("ENTITY DESTROYED");
            setIsDeleteModalOpen(false);
            router.push("/users");
        } else {
            toast.error(res.payload as string || "OPERATION FAILED");
        }
    };

    if (loading && !selectedUser) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-term-accent-cyan)]" />
            </div>
        );
    }

    if (error || !selectedUser) {
        return (
            <div className="border border-[var(--color-term-status-red)] bg-[#1a0505] p-3 text-xs font-mono text-[var(--color-term-status-red)] uppercase">
                ERR: {error || "ENTITY NOT FOUND"}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="border-b border-[var(--color-term-border)] pb-4">
                <Link href="/users" className="inline-flex items-center text-xs font-mono tracking-widest text-[var(--color-term-text-secondary)] hover:text-white transition-colors uppercase">
                    &lt; BACK TO REGISTRY
                </Link>
            </div>

            <div className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)]">
                <div className="border-b border-[var(--color-term-border)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase mb-1">Entity ID: {selectedUser._id}</p>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{selectedUser.username}</h2>
                            <p className="text-sm font-mono text-[var(--color-term-text-secondary)] mt-1">{selectedUser.email}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase tracking-widest ${
                            selectedUser.isBanned 
                            ? 'border border-[var(--color-term-status-red)] text-[var(--color-term-status-red)] bg-[#1a0505]' 
                            : 'border border-[var(--color-term-status-green)] text-[var(--color-term-status-green)] bg-[#051a05]'
                        }`}>
                            {selectedUser.isBanned ? 'STATUS: BANNED' : 'STATUS: ACTIVE'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-[var(--color-term-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="p-6 relative group overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase">Notes Generated</p>
                            <p className="text-3xl font-mono text-white mt-2">{selectedUser.stats?.notes ?? 0}</p>
                        </div>
                    </div>
                    <div className="p-6 relative group overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase">Comments Broadcasted</p>
                            <p className="text-3xl font-mono text-white mt-2">{selectedUser.stats?.comments ?? 0}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[var(--color-term-border)] bg-[#050505] p-6">
                    <h3 className="text-[10px] font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase mb-4">Command Palette</h3>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setIsBanModalOpen(true)}
                            className={`inline-flex items-center border px-4 py-2 text-xs font-mono font-bold tracking-widest transition-colors uppercase ${
                                selectedUser.isBanned
                                ? 'border-[var(--color-term-status-green)] text-[var(--color-term-status-green)] hover:bg-[#051a05]'
                                : 'border-[#ff453a] text-[#ff453a] hover:bg-[#1a0505]'
                            }`}
                        >
                            {selectedUser.isBanned ? '[ RESTORE ACCESS ]' : '[ SUSPEND ENTITY ]'}
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="inline-flex items-center bg-[#ff453a] text-black px-4 py-2 text-xs font-mono font-bold tracking-widest hover:bg-red-400 transition-colors uppercase"
                        >
                            [ DESTROY ENTITY ]
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                onConfirm={handleToggleBan}
                title={selectedUser.isBanned ? "SYS.RESTORE_ENTITY" : "SYS.SUSPEND_ENTITY"}
                description={
                    selectedUser.isBanned 
                    ? `Execute restoration sequence for entity ${selectedUser.username}? Access will be immediately reinstated.`
                    : `Execute suspension sequence for entity ${selectedUser.username}? All active sessions will be terminated.`
                }
                confirmText={selectedUser.isBanned ? "EXECUTE RESTORE" : "EXECUTE SUSPEND"}
                isDangerous={!selectedUser.isBanned}
                loading={loading}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="SYS.DESTROY_ENTITY"
                description={`CRITICAL WARNING: This will permanently wipe ${selectedUser.username} from the database. All ${selectedUser.stats?.notes ?? 0} notes and ${selectedUser.stats?.comments ?? 0} comments will be cascade deleted. Data cannot be recovered.`}
                confirmText="EXECUTE DESTROY"
                isDangerous={true}
                loading={loading}
            />
        </div>
    );
}
