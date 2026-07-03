"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Search, ArrowUp, ArrowDown, Filter } from "lucide-react";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchComments, deleteCommentAdmin, ModerationComment } from "@/features/comments/commentsSlice";
import { RootState } from "@/store/store";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function CommentsPage() {
    const dispatch = useAppDispatch();
    const { comments, loading, total, page, pages } = useSelector((state: RootState) => state.comments);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState<"all" | "parent" | "reply">("all");
    const [sortOrder, setSortOrder] = useState<"-createdAt" | "createdAt">("-createdAt");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<ModerationComment | null>(null);

    const loadComments = useCallback((currentPage: number, search: string, level: string, sort: string) => {
        dispatch(fetchComments({ page: currentPage, search, level: level === "all" ? "" : level, sort }));
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadComments(1, searchTerm, levelFilter, sortOrder);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, levelFilter, sortOrder, loadComments]);

    const handlePageChange = (newPage: number) => {
        loadComments(newPage, searchTerm, levelFilter, sortOrder);
    };

    const toggleLevelFilter = () => {
        if (levelFilter === "all") setLevelFilter("parent");
        else if (levelFilter === "parent") setLevelFilter("reply");
        else setLevelFilter("all");
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "-createdAt" ? "createdAt" : "-createdAt");
    };

    const handleDeleteClick = (comment: ModerationComment) => {
        setCommentToDelete(comment);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!commentToDelete) return;
        
        const res = await dispatch(deleteCommentAdmin(commentToDelete._id));
        if (deleteCommentAdmin.fulfilled.match(res)) {
            toast.success("COMMENT PURGED.", {
                style: { borderRadius: '0px', background: '#0a0a0a', color: '#ff453a', border: '1px solid #1f1f1f' }
            });
            setIsDeleteModalOpen(false);
            setCommentToDelete(null);
            
            if (comments.length === 1 && page > 1) {
                loadComments(page - 1, searchTerm, levelFilter, sortOrder);
            } else {
                loadComments(page, searchTerm, levelFilter, sortOrder);
            }
        } else {
            toast.error(res.payload as string || "OPERATION FAILED");
        }
    };

    const columns = [
        {
            header: "Content",
            accessorKey: "text",
            cell: (comment: ModerationComment) => (
                <div className="max-w-xs truncate text-white" title={comment.text}>
                    {comment.text}
                </div>
            )
        },
        {
            header: "Parent Note",
            accessorKey: "noteId",
            cell: (comment: ModerationComment) => (
                <div className="max-w-xs truncate text-[var(--color-term-text-secondary)]" title={comment.noteId?.subject}>
                    {comment.noteId?.subject || "ORPHANED"}
                </div>
            )
        },
        {
            header: "Author Email",
            accessorKey: "user.email",
            cell: (comment: ModerationComment) => (
                <div className="text-[var(--color-term-accent-cyan)]">
                    {comment.user?.email || "UNKNOWN"}
                </div>
            )
        },
        {
            header: (
                <>
                    Level
                    {levelFilter === "parent" && <span className="ml-1 text-[10px] text-[var(--color-term-accent-cyan)]">[P]</span>}
                    {levelFilter === "reply" && <span className="ml-1 text-[10px] text-[var(--color-term-text-secondary)]">[R]</span>}
                    {levelFilter === "all" && <Filter className="ml-1 h-3 w-3 text-gray-600" />}
                </>
            ),
            accessorKey: "level",
            onHeaderClick: toggleLevelFilter,
            cell: (comment: ModerationComment) => (
                <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    comment.parentCommentId 
                    ? 'border border-[var(--color-term-text-secondary)] text-[var(--color-term-text-secondary)]' 
                    : 'border border-[var(--color-term-accent-cyan)] text-[var(--color-term-accent-cyan)] bg-[#001a1a]'
                }`}>
                    {comment.parentCommentId ? 'REPLY' : 'PARENT'}
                </span>
            )
        },
        {
            header: (
                <>
                    Date
                    {sortOrder === "createdAt" ? (
                        <ArrowUp className="ml-1 h-3 w-3 text-[var(--color-term-accent-cyan)]" />
                    ) : (
                        <ArrowDown className="ml-1 h-3 w-3 text-[var(--color-term-accent-cyan)]" />
                    )}
                </>
            ),
            accessorKey: "createdAt",
            onHeaderClick: toggleSortOrder,
            cell: (comment: ModerationComment) => {
                const date = new Date(comment.createdAt);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
        },
        {
            header: "",
            accessorKey: "actions",
            cell: (comment: ModerationComment) => (
                <button
                    onClick={() => handleDeleteClick(comment)}
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
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.COMMENTS</h1>
                    <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">Targeted content moderation.</p>
                </div>
                
                <div className="relative w-full max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-[var(--color-term-text-secondary)]" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        placeholder="QUERY COMMENTS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 pl-10 pr-3 text-white font-mono text-xs uppercase tracking-widest placeholder-[var(--color-term-text-secondary)] focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                    />
                </div>
            </div>

            <DataTable
                data={comments}
                columns={columns}
                loading={loading}
                page={page}
                totalPages={pages}
                onPageChange={handlePageChange}
                emptyMessage="NO COMMENTS FOUND MATCHING QUERY."
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="SYS.PURGE_COMMENT"
                description={
                    commentToDelete 
                    ? `Are you sure you want to purge this comment? ${!commentToDelete.parentCommentId ? 'Because this is a TOP-LEVEL comment, it will CASCADE DELETE all nested replies.' : ''} Data cannot be recovered.`
                    : ""
                }
                confirmText="EXECUTE PURGE"
                isDangerous={true}
                loading={loading}
            />
        </div>
    );
}
