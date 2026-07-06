"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/hook/dispatch";
import {
    getSavedNotes,
    toggleSave,
    resetSavedNotes,
} from "@/features/savedNotes/savedNotesSlice";
import type { RootState } from "@/store/store";
import NoteCard from "@/features/publicNote/components/NoteCard";
import NoteCardSkeleton from "@/components/NoteCardSkeleton";

const LIMIT = 10;

export default function SavedNotesPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const { accessToken } = useSelector((state: RootState) => state.auth);
    const { notes, loading, error, total, page, savedNoteIds } = useSelector(
        (state: RootState) => state.savedNotes
    );

    const [activeCommentNoteId, setActiveCommentNoteId] = useState<string | null>(null);

    // Auth guard
    useEffect(() => {
        if (!accessToken) {
            router.replace("/login?redirect=/saved");
        }
    }, [accessToken, router]);

    // Initial load
    useEffect(() => {
        dispatch(resetSavedNotes());
        dispatch(getSavedNotes({ page: 1, limit: LIMIT }));

        return () => {
            dispatch(resetSavedNotes());
        };
    }, [dispatch]);

    const handleLoadMore = () => {
        if (loading || notes.length >= total) return;
        dispatch(getSavedNotes({ page: page + 1, limit: LIMIT }));
    };

    if (!accessToken) return null;

    return (
        <div
            className="relative min-h-screen"
            style={{ backgroundColor: "#1a0f00" }}
        >
            {/* Ruled lines overlay */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(80,50,10,0.07) 27px, rgba(80,50,10,0.07) 28px)",
                }}
            />

            <div className="relative mx-auto max-w-5xl px-4 py-10">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="font-special-elite mb-4 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                        style={{ color: "#8a6030" }}
                    >
                        ← Back
                    </button>
                    <h1
                        className="font-im-fell text-4xl italic"
                        style={{ color: "#c8a96e" }}
                    >
                        The Bookmarked Grievances
                    </h1>
                    <p
                        className="font-crimson mt-1 text-sm italic"
                        style={{ color: "#7a5a22" }}
                    >
                        — notes you have set aside for reckoning
                    </p>
                    <div
                        className="mt-4"
                        style={{
                            height: 1,
                            background:
                                "linear-gradient(to right, transparent, rgba(180,130,50,0.4), transparent)",
                        }}
                    />
                </div>

                {/* Loading skeleton */}
                {loading && notes.length === 0 && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <NoteCardSkeleton />
                        <NoteCardSkeleton />
                        <NoteCardSkeleton />
                        <NoteCardSkeleton />
                    </div>
                )}

                {/* Empty state */}
                {!loading && notes.length === 0 && !error && (
                    <div className="py-20 text-center">
                        <p
                            className="font-im-fell text-2xl italic"
                            style={{ color: "#7a5a22" }}
                        >
                            No grievances saved yet.
                        </p>
                        <p
                            className="font-crimson mt-2 text-sm italic"
                            style={{ color: "#5a4020" }}
                        >
                            Bookmark notes from the feed to collect them here.
                        </p>
                        <button
                            onClick={() => router.push("/home")}
                            className="font-special-elite mt-6 rounded-sm px-4 py-2 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                            style={{
                                border: "1px solid rgba(180,130,50,0.4)",
                                color: "#8a6030",
                            }}
                        >
                            Browse the Archive
                        </button>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <p
                        className="font-crimson py-10 text-center text-sm italic"
                        style={{ color: "#a05030" }}
                    >
                        {error}
                    </p>
                )}

                {/* Notes feed */}
                {notes.length > 0 && (
                    <div>
                        <p
                            className="font-special-elite mb-4 text-[10px] uppercase tracking-widest"
                            style={{ color: "#7a5a22" }}
                        >
                            {total} saved {total === 1 ? "note" : "notes"}
                        </p>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {notes.map((note) => (
                                <NoteCard
                                    key={note._id}
                                    note={note}
                                    isLoggedIn={Boolean(accessToken)}
                                    isSaved={Boolean(savedNoteIds[note._id])}
                                    isCommentsOpen={activeCommentNoteId === note._id}
                                    onCommentToggle={(id) =>
                                        setActiveCommentNoteId((prev) => (prev === id ? null : id))
                                    }
                                    onSaveToggle={(noteId) => dispatch(toggleSave(noteId))}
                                />
                            ))}
                        </div>

                        {/* Load more */}
                        {notes.length < total && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="font-special-elite rounded-sm px-6 py-2 text-[10px] uppercase tracking-widest transition-opacity"
                                    style={{
                                        border: "1px solid rgba(180,130,50,0.35)",
                                        color: "#8a6030",
                                        opacity: loading ? 0.5 : 1,
                                        cursor: loading ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}

                        {notes.length >= total && total > 0 && (
                            <p
                                className="font-crimson mt-8 text-center text-sm italic"
                                style={{ color: "#5a4020" }}
                            >
                                — end of your bookmarks —
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
