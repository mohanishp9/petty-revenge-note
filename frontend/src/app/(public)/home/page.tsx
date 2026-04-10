"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Heart, MessageCircle, SmilePlus } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { setUserFromStorage } from "@/features/auth/authSlice";
import { getAllNotes, reactToNote, toggleLike } from "@/features/publicNote/publicNoteSlice";
import type { Note, getNotesParams } from "@/features/publicNote/types";
import type { RootState } from "@/store/store";

const DEFAULT_REACTIONS = ["😂", "😡", "😳", "😭"] as const;
const NOTES_PER_PAGE = 12;

const getReactionTotal = (reactionsCount: Record<string, number>) =>
    Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

const formatReactionSummary = (reactionsCount: Record<string, number>) => {
    const entries = Object.entries(reactionsCount)
        .filter(([, count]) => count > 0)
        .sort(([, countA], [, countB]) => countB - countA);

    if (!entries.length) {
        return "No reactions yet";
    }

    return entries
        .slice(0, 3)
        .map(([emoji, count]) => `${emoji} ${count}`)
        .join("  ");
};

const NoteCard = ({ note, isLoggedIn }: { note: Note; isLoggedIn: boolean }) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);
    const reactionMenuRef = useRef<HTMLDivElement | null>(null);

    const hasLiked = note.hasLiked;
    const userReaction = note.userReaction;
    const reactionCounts = note.reactionsCount;
    const visibleReactionCount = getReactionTotal(reactionCounts);

    useEffect(() => {
        if (!isReactionMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!reactionMenuRef.current?.contains(event.target as Node)) {
                setIsReactionMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isReactionMenuOpen]);

    const handleLikeClick = () => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        dispatch(toggleLike({ noteId: note._id }));
    };

    const handleReactionSelect = (reaction: string) => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        dispatch(reactToNote({ noteId: note._id, emoji: reaction }));
        setIsReactionMenuOpen(false);
    };

    return (
        <article
            className="relative rounded-sm transition"
            style={{
                background: "linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)",
                backgroundImage: `
          repeating-linear-gradient(180deg, transparent, transparent 23px, rgba(100,60,10,0.1) 23px, rgba(100,60,10,0.1) 24px),
          linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)
        `,
                padding: "1.25rem",
                border: "1px solid rgba(120,80,20,0.2)",
            }}
        >
            <div className="absolute bottom-0 left-9 top-0 w-px" style={{ background: "rgba(180,40,30,0.3)" }} />

            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-4"
                style={{
                    background: "#0e0800",
                    opacity: 0.5,
                    clipPath: "polygon(0% 70%,2% 35%,4% 60%,6% 25%,8% 55%,10% 20%,13% 50%,16% 30%,20% 60%,24% 25%,28% 55%,33% 35%,38% 65%,43% 20%,48% 55%,54% 30%,60% 60%,66% 25%,72% 55%,78% 35%,84% 65%,90% 20%,94% 50%,97% 30%,100% 55%,100% 100%,0% 100%)",
                }}
            />

            <div className="mb-3 flex items-center gap-2.5 pl-2">
                <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm text-xl"
                    style={{ background: "rgba(120,80,20,0.12)", border: "1px solid rgba(120,80,20,0.2)" }}
                >
                    {note.categoryEmoji}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-special-elite truncate text-[11px] tracking-wide text-stone-800">
                        {note.showUsername ? note.user.username : "Anonymous"}
                    </p>
                    <p className="font-crimson text-[11px] italic" style={{ color: "#8a6030" }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {!isLoggedIn && (
                    <button
                        type="button"
                        className="font-special-elite flex-shrink-0 rounded-sm px-2 py-0.5 text-[9px] uppercase tracking-widest"
                        style={{ border: "1px solid rgba(120,80,20,0.25)", color: "#8a6030" }}
                        onClick={() => router.push("/login")}
                    >
                        Login
                    </button>
                )}
            </div>

            {note.subject && (
                <h2 className="font-im-fell mb-1.5 pl-2 text-[16px] italic leading-tight" style={{ color: "#1e0f02" }}>
                    {note.subject}
                </h2>
            )}

            <p
                className="font-crimson mb-3 line-clamp-4 pl-2 text-[14px] leading-relaxed"
                style={{ color: "#3a2008" }}
            >
                {note.content}
            </p>

            <div
                className="font-crimson mb-3 pl-2 pb-2 text-[12px] italic"
                style={{ color: "#7a5020", borderBottom: "1px solid rgba(100,60,10,0.15)" }}
            >
                {formatReactionSummary(reactionCounts)}
            </div>

            <div className="grid grid-cols-3 gap-1.5 pl-1">
                <button
                    type="button"
                    onClick={handleLikeClick}
                    disabled={!isLoggedIn}
                    className="font-special-elite flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-[9px] uppercase tracking-wider transition"
                    style={{
                        border: `1px solid ${hasLiked ? "rgba(160,40,20,0.35)" : "rgba(100,60,10,0.2)"}`,
                        background: hasLiked ? "rgba(160,40,20,0.08)" : "transparent",
                        color: hasLiked ? "#8a2510" : "#6a4515",
                        opacity: !isLoggedIn ? 0.6 : 1,
                    }}
                >
                    <Heart className={`h-3 w-3 ${hasLiked ? "fill-current" : ""}`} />
                    <span>{note.likes}</span>
                </button>

                <div className="relative" ref={reactionMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isLoggedIn) {
                                router.push("/login");
                                return;
                            }

                            setIsReactionMenuOpen((current) => !current);
                        }}
                        disabled={!isLoggedIn}
                        className="font-special-elite flex w-full items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-[9px] uppercase tracking-wider transition"
                        style={{
                            border: `1px solid ${userReaction ? "rgba(160,120,20,0.4)" : "rgba(100,60,10,0.2)"}`,
                            background: userReaction ? "rgba(160,120,20,0.1)" : "transparent",
                            color: userReaction ? "#7a5010" : "#6a4515",
                            opacity: !isLoggedIn ? 0.6 : 1,
                        }}
                    >
                        {userReaction ? <span style={{ fontSize: 14 }}>{userReaction}</span> : <SmilePlus className="h-3 w-3" />}
                        <span>{userReaction ?? "React"}</span>
                    </button>

                    {isReactionMenuOpen && (
                        <div
                            className="absolute left-1/2 top-[calc(100%+8px)] z-10 flex -translate-x-1/2 items-center gap-1 rounded-sm px-2 py-1.5"
                            style={{
                                background: "#f4e7c1",
                                border: "1px solid rgba(120,80,20,0.35)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                            }}
                        >
                            {DEFAULT_REACTIONS.map((reaction) => (
                                <button
                                    key={reaction}
                                    type="button"
                                    onClick={() => handleReactionSelect(reaction)}
                                    className="flex h-9 w-9 items-center justify-center rounded-sm text-xl transition hover:scale-110"
                                    style={{ background: userReaction === reaction ? "rgba(120,80,20,0.15)" : "transparent" }}
                                >
                                    {reaction}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="font-special-elite flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-[9px] uppercase tracking-wider"
                    style={{ border: "1px solid rgba(100,60,10,0.2)", color: "#6a4515" }}
                >
                    <MessageCircle className="h-3 w-3" />
                    <span>{note.commentsCount}</span>
                </button>
            </div>

            <div className="font-special-elite mt-3 pl-2 text-[9px] uppercase tracking-[0.22em]" style={{ color: "#8a6030" }}>
                {visibleReactionCount} reactions
            </div>
        </article>
    );
};

const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { notes, loading, error, count } = useSelector(
        (state: RootState) => state.publicNote
    );
    const { token } = useSelector((state: RootState) => state.auth);

    const [sort, setSort] = useState<getNotesParams["sort"] | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        dispatch(setUserFromStorage());
    }, [dispatch]);

    useEffect(() => {
        dispatch(
            getAllNotes(sort ? { sort, page, limit: NOTES_PER_PAGE } : { page, limit: NOTES_PER_PAGE })
        );
    }, [dispatch, sort, page, token]);

    useEffect(() => {
        if (page === 1) {
            setHasMore(count === NOTES_PER_PAGE || count === 0);
            return;
        }

        setHasMore(count === NOTES_PER_PAGE);
    }, [count, page]);

    useEffect(() => {
        const node = loadMoreRef.current;

        if (!node || !hasMore) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (firstEntry?.isIntersecting && !loading) {
                    setPage((currentPage) => currentPage + 1);
                }
            },
            { rootMargin: "320px 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasMore, loading]);

    const handleSortChange = (newSort: "mostLiked" | "oldest" | undefined) => {
        setSort(newSort);
        setPage(1);
        setHasMore(true);
    };

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(360deg, #f2e2b0 10%, #f5e9c8 30%, #ede0b0 90%)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(180,130,40,0.15)" }}>
                <p className="font-special-elite mb-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>
                    The Public Ledger
                </p>
                <h1 className="font-im-fell text-3xl italic" style={{ color: "#8a6a30" }}>
                    Petty Revenge Notes
                </h1>
                <p className="font-crimson mt-1 text-sm italic" style={{ color: "#8a6a30" }}>
                    - every slight, duly recorded for posterity
                </p>
            </div>

            <div className="flex gap-2 px-6 py-3" style={{ borderBottom: "1px solid rgba(180,130,40,0.1)" }}>
                {[
                    { label: "Newest", value: undefined },
                    { label: "Oldest", value: "oldest" as const },
                    { label: "Most Liked", value: "mostLiked" as const },
                ].map(({ label, value }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => handleSortChange(value)}
                        className="font-special-elite rounded-sm px-3 py-1 text-[10px] uppercase tracking-widest transition"
                        style={{
                            border: `1px solid ${sort === value ? "rgba(180,130,40,0.6)" : "rgba(180,130,40,0.25)"}`,
                            background: sort === value ? "rgba(180,130,40,0.12)" : "transparent",
                            color: "#8a6a30",
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mx-auto max-w-6xl px-6 py-6">
                {loading && notes.length === 0 && (
                    <p className="font-crimson italic" style={{ color: "#7a5a22" }}>
                        Retrieving the records...
                    </p>
                )}
                {error && <p className="font-crimson italic" style={{ color: "#8a2510" }}>{error}</p>}

                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                    {notes.map((note) => (
                        <NoteCard key={note._id} note={note} isLoggedIn={Boolean(token)} />
                    ))}
                </div>

                <div ref={loadMoreRef} className="h-8" />

                {loading && notes.length > 0 && (
                    <p className="font-crimson mt-6 text-center italic" style={{ color: "#7a5a22" }}>
                        Loading more notes...
                    </p>
                )}

                {!hasMore && notes.length > 0 && (
                    <p className="font-special-elite mt-6 text-center text-[10px] uppercase tracking-[0.25em]" style={{ color: "#8a6a30" }}>
                        End of the ledger
                    </p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
