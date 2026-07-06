"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchNotes, deleteNoteAdmin, ModerationNote } from "@/features/notes/notesSlice";
import { RootState } from "@/store/store";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function NotesPage() {
    const dispatch = useAppDispatch();
    const { notes, loading, total, page, pages } = useSelector((state: RootState) => state.notes);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<ModerationNote | null>(null);

    const loadNotes = useCallback((currentPage: number, search: string) => {
        dispatch(fetchNotes({ page: currentPage, search }));
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadNotes(1, searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, loadNotes]);

    const handlePageChange = (newPage: number) => {
        loadNotes(newPage, searchTerm);
    };

    const handleDeleteClick = (note: ModerationNote) => {
        setNoteToDelete(note);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!noteToDelete) return;
        
        const res = await dispatch(deleteNoteAdmin(noteToDelete._id));
        if (deleteNoteAdmin.fulfilled.match(res)) {
            toast.success("CONTENT PURGED.", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#ff453a', border: '1px solid #1f1f1f' }
            });
            setIsDeleteModalOpen(false);
            setNoteToDelete(null);
            
            if (notes.length === 1 && page > 1) {
                loadNotes(page - 1, searchTerm);
            } else {
                loadNotes(page, searchTerm);
            }
        } else {
            toast.error(res.payload as string || "OPERATION FAILED");
        }
    };

    const columns = [
        {
            header: "Subject",
            accessorKey: "subject",
            cell: (note: ModerationNote) => (
                <div className="max-w-xs truncate text-white" title={note.subject}>
                    {note.subject}
                </div>
            )
        },
        {
            header: "Content Snippet",
            accessorKey: "content",
            cell: (note: ModerationNote) => (
                <div className="max-w-sm truncate text-[var(--color-term-text-secondary)]" title={note.content}>
                    {note.content}
                </div>
            )
        },
        {
            header: "Author Email",
            accessorKey: "user.email",
            cell: (note: ModerationNote) => (
                <div className="text-[var(--color-term-accent-cyan)]">
                    {note.user?.email || "UNKNOWN"}
                </div>
            )
        },
        {
            header: "Created",
            accessorKey: "createdAt",
            cell: (note: ModerationNote) => {
                const date = new Date(note.createdAt);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
        },
        {
            header: "Reports",
            accessorKey: "reportsCount",
            cell: (note: ModerationNote) => (
                <div className={`font-bold flex items-center gap-2 ${note.reportsCount && note.reportsCount > 0 ? 'text-[var(--color-term-status-red)]' : 'text-[var(--color-term-text-secondary)]'}`}>
                    <span>{note.reportsCount || 0}</span>
                    {(note.reportsCount || 0) > 0 && (
                        <>
                            <span className="text-[var(--color-term-border)]">|</span>
                            <Link href={`/notes/${note._id}/reports`} className="hover:underline text-[var(--color-term-accent-cyan)] font-mono text-[10px]">
                                [SEE]
                            </Link>
                        </>
                    )}
                </div>
            )
        },
        {
            header: "",
            accessorKey: "actions",
            cell: (note: ModerationNote) => (
                <button
                    onClick={() => handleDeleteClick(note)}
                    className="inline-flex items-center border border-[var(--color-term-status-red)] bg-[#1a0505] px-3 py-1 text-[10px] tracking-widest font-bold text-[var(--color-term-status-red)] hover:bg-[#ff453a] hover:text-black transition-colors uppercase"
                >
                    [PURGE]
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-term-border)] pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.CONTENT</h1>
                    <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">Moderation and data purging.</p>
                </div>
                
                <div className="relative w-full max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-[var(--color-term-text-secondary)]" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        placeholder="QUERY CONTENT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 pl-10 pr-3 text-white font-mono text-xs uppercase tracking-widest placeholder-[var(--color-term-text-secondary)] focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                    />
                </div>
            </div>

            <DataTable
                data={notes}
                columns={columns}
                loading={loading}
                page={page}
                totalPages={pages}
                onPageChange={handlePageChange}
                emptyMessage="NO CONTENT FOUND MATCHING QUERY."
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="SYS.PURGE_CONTENT"
                description={
                    noteToDelete 
                    ? `Are you sure you want to purge "${noteToDelete.subject}"? This will CASCADE DELETE all nested objects (comments, reactions). Data cannot be recovered.`
                    : ""
                }
                confirmText="EXECUTE PURGE"
                isDangerous={true}
                loading={loading}
            />
        </div>
    );
}
