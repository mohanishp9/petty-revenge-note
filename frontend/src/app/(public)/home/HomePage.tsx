"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ChevronDown, Heart, LoaderCircle, MessageCircle, Send, SmilePlus, X, Reply } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { addComment, addReply, getNoteComments, resetComments } from "@/features/comments/commentsSlice";
import type { CommentType, CommentsState } from "@/features/comments/types";
import { setUserFromStorage } from "@/features/auth/authSlice";
import { getAllNotes, reactToNote, toggleLike } from "@/features/publicNote/publicNoteSlice";
import type { Note, getNotesParams } from "@/features/publicNote/types";
import { clearTopNotesByEmoji, getTopNotesByEmoji } from "@/features/topNotesByEmoji/topNotesByEmojiSlice";
import type { RootState } from "@/store/store";

const DEFAULT_REACTIONS = ["😂", "😡", "😳", "😭"] as const;
const NOTES_PER_PAGE = 12;
const COMMENTS_PER_PAGE = 10;

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

const formatCommentAuthor = (comment: CommentType) => `Witness ${comment.user.slice(-4).toUpperCase()}`;

type NoteCardProps = {
    isCommentsOpen: boolean;
    isLoggedIn: boolean;
    note: Note;
    onCommentToggle: (noteId: string) => void;
};

const NoteCard = ({ isCommentsOpen, isLoggedIn, note, onCommentToggle }: NoteCardProps) => {
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
            className="relative rounded-sm transition duration-300 ease-out"
            style={{
                background: "linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)",
                backgroundImage: `...`,
                padding: "1.5rem",
                border: "1px solid rgba(120,80,20,0.2)",
                breakInside: "avoid",
                marginBottom: "1.25rem",
                display: "inline-block",
                width: "100%",
            }}
        >
            <div className="absolute bottom-0 left-11 top-0 w-px" style={{ background: "rgba(180,40,30,0.3)" }} />

            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-4"
                style={{
                    background: "#0e0800",
                    opacity: 0.5,
                    clipPath: "polygon(0% 70%,2% 35%,4% 60%,6% 25%,8% 55%,10% 20%,13% 50%,16% 30%,20% 60%,24% 25%,28% 55%,33% 35%,38% 65%,43% 20%,48% 55%,54% 30%,60% 60%,66% 25%,72% 55%,78% 35%,84% 65%,90% 20%,94% 50%,97% 30%,100% 55%,100% 100%,0% 100%)",
                }}
            />

            <div className="mb-4 flex items-center gap-3 pl-4">
                <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm text-2xl"
                    style={{ background: "rgba(120,80,20,0.12)", border: "1px solid rgba(120,80,20,0.2)" }}
                >
                    {note.categoryEmoji}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-special-elite truncate text-[12px] tracking-wide text-stone-800">
                        {note.showUsername ? note.user.username : "Anonymous"}
                    </p>
                    <p className="font-crimson text-[12px] italic" style={{ color: "#8a6030" }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {!isLoggedIn && (
                    <button
                        type="button"
                        className="font-special-elite flex-shrink-0 rounded-sm px-2 py-1 text-[9px] uppercase tracking-widest"
                        style={{ border: "1px solid rgba(120,80,20,0.25)", color: "#8a6030" }}
                        onClick={() => router.push("/login")}
                    >
                        Login
                    </button>
                )}
            </div>

            {note.subject && (
                <h2 className="font-im-fell mb-2 pl-4 text-[20px] italic leading-tight" style={{ color: "#1e0f02" }}>
                    {note.subject}
                </h2>
            )}

            <p
                className="font-crimson mb-4 pl-4 pr-2 text-[18px] leading-[1.7]"
                style={{ color: "#3a2008" }}
            >
                {note.content}
            </p>

            <div
                className="font-crimson mb-4 pl-4 pb-3 text-[13px] italic"
                style={{ color: "#7a5020", borderBottom: "1px solid rgba(100,60,10,0.15)" }}
            >
                {formatReactionSummary(reactionCounts)}
            </div>

            <div className="grid grid-cols-3 gap-2 pl-3">
                <button
                    type="button"
                    onClick={handleLikeClick}
                    disabled={!isLoggedIn}
                    className="font-special-elite flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-[10px] uppercase tracking-wider transition"
                    style={{
                        border: `1px solid ${hasLiked ? "rgba(160,40,20,0.35)" : "rgba(100,60,10,0.2)"}`,
                        background: hasLiked ? "rgba(160,40,20,0.08)" : "transparent",
                        color: hasLiked ? "#8a2510" : "#6a4515",
                        opacity: !isLoggedIn ? 0.6 : 1,
                    }}
                >
                    <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
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
                        className="font-special-elite flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2 text-[10px] uppercase tracking-wider transition"
                        style={{
                            border: `1px solid ${userReaction ? "rgba(160,120,20,0.4)" : "rgba(100,60,10,0.2)"}`,
                            background: userReaction ? "rgba(160,120,20,0.1)" : "transparent",
                            color: userReaction ? "#7a5010" : "#6a4515",
                            opacity: !isLoggedIn ? 0.6 : 1,
                        }}
                    >
                        {userReaction ? <span style={{ fontSize: 16 }}>{userReaction}</span> : <SmilePlus className="h-4 w-4" />}
                        <span>{userReaction ?? "React"}</span>
                    </button>

                    {isReactionMenuOpen && (
                        <div
                            className="absolute left-1/2 top-[calc(100%+10px)] z-10 flex -translate-x-1/2 items-center gap-1 rounded-sm px-2 py-2"
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
                                    className="flex h-10 w-10 items-center justify-center rounded-sm text-xl transition hover:scale-110"
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
                    onClick={() => onCommentToggle(note._id)}
                    className="font-special-elite flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-[10px] uppercase tracking-wider transition"
                    style={{
                        border: `1px solid ${isCommentsOpen ? "rgba(150,90,10,0.45)" : "rgba(100,60,10,0.2)"}`,
                        background: isCommentsOpen ? "rgba(150,90,10,0.1)" : "transparent",
                        color: isCommentsOpen ? "#7b4f15" : "#6a4515",
                    }}
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{note.commentsCount}</span>
                </button>
            </div>

            <div className="font-special-elite mt-4 pl-4 text-[9px] uppercase tracking-[0.22em]" style={{ color: "#8a6030" }}>
                {visibleReactionCount} reactions
            </div>
        </article>
    );
};

type CommentsPanelProps = {
    activeNote: Note | null;
    commentInput: string;
    commentsState: CommentsState;
    isLoggedIn: boolean;
    onChangeInput: (value: string) => void;
    onClose: () => void;
    onLoadMore: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReplySubmit: (commentId: string, text: string) => void;
};

const CommentItem = ({
    comment,
    isLoggedIn,
    onReplyClick,
    replyingTo,
    replyInput,
    onReplyInputChange,
    onReplySubmit,
}: {
    comment: CommentType;
    isLoggedIn: boolean;
    onReplyClick: (commentId: string) => void;
    replyingTo: string | null;
    replyInput: string;
    onReplyInputChange: (value: string) => void;
    onReplySubmit: (commentId: string, text: string) => void;
}) => {
    const isReplying = replyingTo === comment._id;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        <div className="space-y-2">
            <article
                className="rounded-sm border px-4 py-3"
                style={{
                    background: "rgba(255,249,236,0.76)",
                    borderColor: "rgba(120,80,20,0.16)",
                }}
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-special-elite text-[10px] uppercase tracking-[0.2em]" style={{ color: "#7a5a22" }}>
                        {formatCommentAuthor(comment)}
                    </p>
                    <div className="flex items-center gap-2">
                        {hasReplies && (
                            <span className="font-crimson text-xs italic" style={{ color: "#8a6030" }}>
                                {comment.repliesCount} {comment.repliesCount === 1 ? "reply" : "replies"}
                            </span>
                        )}
                        <p className="font-crimson text-xs italic" style={{ color: "#8a6030" }}>
                            {new Date(comment.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a2008" }}>
                    {comment.text}
                </p>
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={() => onReplyClick(comment._id)}
                        className="mt-2 flex items-center gap-1.5 font-special-elite text-[9px] uppercase tracking-[0.2em] transition"
                        style={{ color: "#7a5a22", opacity: isReplying ? 0.6 : 1 }}
                    >
                        <Reply className="h-3 w-3" />
                        {isReplying ? "Cancel" : "Reply"}
                    </button>
                )}
            </article>

            {isReplying && (
                <div className="ml-4 rounded-sm border px-3 py-2" style={{ borderColor: "rgba(120,80,20,0.16)" }}>
                    <textarea
                        value={replyInput}
                        onChange={(e) => onReplyInputChange(e.target.value)}
                        placeholder="Write your reply..."
                        rows={2}
                        className="font-crimson w-full resize-none rounded-sm border bg-transparent px-2 py-2 text-[14px] leading-6 outline-none"
                        style={{ borderColor: "rgba(120,80,20,0.22)", color: "#3a2008" }}
                    />
                    <button
                        type="button"
                        onClick={() => onReplySubmit(comment._id, replyInput)}
                        disabled={!replyInput.trim()}
                        className="font-special-elite mt-2 flex items-center gap-2 rounded-sm px-3 py-2 text-[9px] uppercase tracking-[0.2em] transition"
                        style={{
                            background: "rgba(122,90,34,0.12)",
                            border: "1px solid rgba(120,80,20,0.22)",
                            color: "#6a4515",
                            opacity: !replyInput.trim() ? 0.6 : 1,
                        }}
                    >
                        <Send className="h-3 w-3" />
                        <span>Send Reply</span>
                    </button>
                </div>
            )}

            {hasReplies && (
                <div className="ml-4 space-y-2 border-l-2 pl-3" style={{ borderColor: "rgba(120,80,20,0.12)" }}>
                    {comment.replies!.map((reply) => (
                        <article
                            key={reply._id}
                            className="rounded-sm border px-3 py-2"
                            style={{
                                background: "rgba(255,249,236,0.5)",
                                borderColor: "rgba(120,80,20,0.12)",
                            }}
                        >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <p className="font-special-elite text-[9px] uppercase tracking-[0.18em]" style={{ color: "#7a5a22" }}>
                                    {formatCommentAuthor(reply)}
                                </p>
                                <p className="font-crimson text-xs italic" style={{ color: "#8a6030" }}>
                                    {new Date(reply.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <p className="font-crimson text-[14px] leading-6" style={{ color: "#3a2008" }}>
                                {reply.text}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentsPanel = ({
    activeNote,
    commentInput,
    commentsState,
    isLoggedIn,
    onChangeInput,
    onClose,
    onLoadMore,
    onSubmit,
    onReplySubmit,
}: CommentsPanelProps) => {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState("");

    if (!activeNote) {
        return null;
    }

    const handleReplyClick = (commentId: string) => {
        if (replyingTo === commentId) {
            setReplyingTo(null);
            setReplyInput("");
        } else {
            setReplyingTo(commentId);
            setReplyInput("");
        }
    };

    const handleReplyInputChange = (value: string) => {
        setReplyInput(value);
    };

    const handleReplySubmitInternal = (commentId: string, text: string) => {
        if (text.trim()) {
            onReplySubmit(commentId, text.trim());
            setReplyingTo(null);
            setReplyInput("");
        }
    };

    return (
        <aside
            className="w-full overflow-hidden rounded-sm border xl:sticky xl:top-24"
            style={{
                background: "linear-gradient(180deg, #f8ecd0 0%, #f2e2b2 100%)",
                borderColor: "rgba(120,80,20,0.2)",
                boxShadow: "0 18px 36px rgba(120,80,20,0.08)",
                maxHeight: "calc(100vh - 7rem)",
            }}
        >
            <div
                className="flex items-start justify-between gap-3 border-b px-5 py-4"
                style={{ borderColor: "rgba(120,80,20,0.14)" }}
            >
                <div>
                    <p className="font-special-elite text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>
                        Comment Thread
                    </p>
                    <h2 className="font-im-fell mt-1 text-2xl italic" style={{ color: "#5a3210" }}>
                        {activeNote.subject || "Untitled Note"}
                    </h2>
                    <p className="font-crimson mt-1 text-sm italic" style={{ color: "#8a6030" }}>
                        {activeNote.commentsCount} comments on this note
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-sm border"
                    style={{ borderColor: "rgba(120,80,20,0.2)", color: "#6a4515" }}
                    aria-label="Close comments"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex h-full max-h-[calc(100vh-13rem)] flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {commentsState.loading && commentsState.comments.length === 0 && (
                        <div className="flex items-center justify-center py-10" style={{ color: "#8a6030" }}>
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                        </div>
                    )}

                    {!commentsState.loading && commentsState.comments.length === 0 && (
                        <p className="font-crimson py-8 text-center italic" style={{ color: "#8a6030" }}>
                            No comments yet. Start the thread.
                        </p>
                    )}

                    <div className="space-y-3">
                        {commentsState.comments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                isLoggedIn={isLoggedIn}
                                onReplyClick={handleReplyClick}
                                replyingTo={replyingTo}
                                replyInput={replyInput}
                                onReplyInputChange={handleReplyInputChange}
                                onReplySubmit={handleReplySubmitInternal}
                            />
                        ))}
                    </div>

                    {commentsState.hasMore && (
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={commentsState.loading}
                            className="font-special-elite mt-4 w-full rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition"
                            style={{
                                border: "1px solid rgba(120,80,20,0.22)",
                                color: "#6a4515",
                                opacity: commentsState.loading ? 0.7 : 1,
                            }}
                        >
                            {commentsState.loading ? "Loading..." : "Load Older Comments"}
                        </button>
                    )}
                </div>

                <div className="border-t px-5 py-4" style={{ borderColor: "rgba(120,80,20,0.14)" }}>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <textarea
                            value={commentInput}
                            onChange={(event) => onChangeInput(event.target.value)}
                            placeholder={isLoggedIn ? "Write your comment..." : "Login to add a comment"}
                            disabled={!isLoggedIn}
                            rows={4}
                            className="font-crimson w-full resize-none rounded-sm border bg-transparent px-3 py-3 text-[15px] leading-6 outline-none"
                            style={{
                                borderColor: "rgba(120,80,20,0.22)",
                                color: "#3a2008",
                                opacity: isLoggedIn ? 1 : 0.65,
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!isLoggedIn || !commentInput.trim()}
                            className="font-special-elite flex w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition"
                            style={{
                                background: "rgba(122,90,34,0.12)",
                                border: "1px solid rgba(120,80,20,0.22)",
                                color: "#6a4515",
                                opacity: !isLoggedIn || !commentInput.trim() ? 0.6 : 1,
                            }}
                        >
                            <Send className="h-4 w-4" />
                            <span>Add Comment</span>
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    );
};

const HomePage = () => {
    const dispatch = useAppDispatch();
    const { notes, loading, error, count } = useSelector(
        (state: RootState) => state.publicNote
    );
    const { token } = useSelector((state: RootState) => state.auth);
    const commentsState = useSelector((state: RootState) => state.comments);
    const topNotesByEmoji = useSelector((state: RootState) => state.getTopNotesByEmoji);

    const [sort, setSort] = useState<getNotesParams["sort"] | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [activeCommentNoteId, setActiveCommentNoteId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("");
    const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const emojiMenuRef = useRef<HTMLDivElement | null>(null);

    const displayedNotes = selectedEmoji
        ? topNotesByEmoji.data.map((item) => item.note)
        : notes;
    const activeNote = displayedNotes.find((note) => note._id === activeCommentNoteId) ?? null;
    const isCommentPanelOpen = Boolean(activeCommentNoteId);
    const hasMore = count === NOTES_PER_PAGE;
    const feedLoading = selectedEmoji ? topNotesByEmoji.loading : loading;
    const feedError = selectedEmoji ? topNotesByEmoji.error : error;

    useEffect(() => {
        dispatch(setUserFromStorage());
    }, [dispatch]);

    useEffect(() => {
        if (selectedEmoji) {
            return;
        }

        dispatch(
            getAllNotes(sort ? { sort, page, limit: NOTES_PER_PAGE } : { page, limit: NOTES_PER_PAGE })
        );
    }, [dispatch, sort, page, selectedEmoji, token]);

    useEffect(() => {
        const node = loadMoreRef.current;

        if (!node || !hasMore || selectedEmoji) {
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
    }, [hasMore, loading, selectedEmoji]);

    useEffect(() => {
        if (!isEmojiMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!emojiMenuRef.current?.contains(event.target as Node)) {
                setIsEmojiMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isEmojiMenuOpen]);

    useEffect(() => {
        if (!activeCommentNoteId) {
            dispatch(resetComments());
            return;
        }

        dispatch(
            getNoteComments({
                noteId: activeCommentNoteId,
                page: 1,
                limit: COMMENTS_PER_PAGE,
            })
        );
    }, [activeCommentNoteId, dispatch]);

    const handleSortChange = (newSort: "mostLiked" | "oldest" | undefined) => {
        if (selectedEmoji) {
            setSelectedEmoji("");
            dispatch(clearTopNotesByEmoji());
        }
        setSort(newSort);
        setPage(1);
    };

    const handleEmojiSortChange = (emoji: string) => {
        setActiveCommentNoteId(null);
        setCommentInput("");
        dispatch(resetComments());
        setIsEmojiMenuOpen(false);

        if (!emoji) {
            setSelectedEmoji("");
            dispatch(clearTopNotesByEmoji());
            setPage(1);
            return;
        }

        setSelectedEmoji(emoji);
        dispatch(getTopNotesByEmoji(emoji));
    };

    const handleCommentToggle = (noteId: string) => {
        if (activeCommentNoteId === noteId) {
            setActiveCommentNoteId(null);
            setCommentInput("");
            dispatch(resetComments());
            return;
        }

        setActiveCommentNoteId(noteId);
        setCommentInput("");
    };

    const handleLoadMoreComments = () => {
        if (!activeCommentNoteId || commentsState.loading || !commentsState.hasMore) {
            return;
        }

        dispatch(
            getNoteComments({
                noteId: activeCommentNoteId,
                page: commentsState.page + 1,
                limit: COMMENTS_PER_PAGE,
            })
        );
    };

    const handleCloseComments = () => {
        setActiveCommentNoteId(null);
        setCommentInput("");
        dispatch(resetComments());
    };

    const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!activeCommentNoteId || !commentInput.trim()) {
            return;
        }

        const action = await dispatch(
            addComment({
                noteId: activeCommentNoteId,
                text: commentInput.trim(),
            })
        );

        if (addComment.fulfilled.match(action)) {
            setCommentInput("");
        }
    };

    const handleReplySubmit = async (commentId: string, text: string) => {
        if (!text.trim()) {
            return;
        }

        const action = await dispatch(
            addReply({
                commentId,
                text: text.trim(),
            })
        );

        if (addReply.fulfilled.match(action)) {
            // Reply was added successfully
        }
    };

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(360deg, #f2e2b0 10%, #f5e9c8 30%, #ede0b0 90%)" }}>
            <div className="px-4 py-5 sm:px-6 lg:px-8" style={{ borderBottom: "1px solid rgba(180,130,40,0.15)" }}>
                <p className="font-special-elite mb-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>
                    The Public Ledger
                </p>
                <h1 className="font-im-fell text-3xl italic sm:text-4xl" style={{ color: "#8a6a30" }}>
                    Petty Revenge Notes
                </h1>
                <p className="font-crimson mt-1 text-sm italic sm:text-base" style={{ color: "#8a6a30" }}>
                    - every slight, duly recorded for posterity
                </p>
            </div>

            <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-6 lg:px-8" style={{ borderBottom: "1px solid rgba(180,130,40,0.1)" }}>
                {[
                    { label: "Newest", value: undefined },
                    { label: "Oldest", value: "oldest" as const },
                    { label: "Most Liked", value: "mostLiked" as const },
                ].map(({ label, value }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => handleSortChange(value)}
                        className="font-special-elite rounded-sm px-3 py-2 text-[10px] uppercase tracking-widest transition"
                        style={{
                            border: `1px solid ${sort === value ? "rgba(180,130,40,0.6)" : "rgba(180,130,40,0.25)"}`,
                            background: sort === value ? "rgba(180,130,40,0.12)" : "transparent",
                            color: "#8a6a30",
                        }}
                    >
                        {label}
                    </button>
                ))}

                <div className="relative" ref={emojiMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsEmojiMenuOpen((current) => !current)}
                        className="font-special-elite flex min-h-[42px] items-center gap-3 rounded-sm px-3 py-2 text-[10px] uppercase tracking-widest transition"
                        style={{
                            border: `1px solid ${selectedEmoji ? "rgba(180,130,40,0.6)" : "rgba(180,130,40,0.25)"}`,
                            background: selectedEmoji ? "rgba(180,130,40,0.12)" : "transparent",
                            color: "#8a6a30",
                        }}
                    >
                        <span>Top By Emoji</span>
                        <span
                            className="flex min-w-[72px] items-center justify-center rounded-sm px-3 py-1.5 normal-case tracking-normal"
                            style={{
                                background: selectedEmoji ? "rgba(180,130,40,0.18)" : "rgba(180,130,40,0.08)",
                                border: "1px solid rgba(180,130,40,0.2)",
                                color: "#6a4515",
                                fontSize: selectedEmoji ? "1.35rem" : "0.8rem",
                                lineHeight: 1,
                            }}
                        >
                            {selectedEmoji || "All"}
                        </span>
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    </button>

                    {isEmojiMenuOpen && (
                        <div
                            className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[220px] rounded-sm p-2"
                            style={{
                                background: "linear-gradient(180deg, #f4e7c1 0%, #eeddb0 100%)",
                                border: "1px solid rgba(120,80,20,0.28)",
                                boxShadow: "0 12px 28px rgba(40,20,0,0.24)",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => handleEmojiSortChange("")}
                                className="font-special-elite flex w-full items-center justify-between rounded-sm px-3 py-2 text-[10px] uppercase tracking-widest transition"
                                style={{
                                    background: !selectedEmoji ? "rgba(180,130,40,0.14)" : "transparent",
                                    color: "#6a4515",
                                }}
                            >
                                <span>All</span>
                                {!selectedEmoji && <span>•</span>}
                            </button>
                            {DEFAULT_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiSortChange(emoji)}
                                    className="font-special-elite flex w-full items-center justify-between rounded-sm px-3 py-2 text-[10px] uppercase tracking-widest transition"
                                    style={{
                                        background: selectedEmoji === emoji ? "rgba(180,130,40,0.14)" : "transparent",
                                        color: "#6a4515",
                                    }}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-[1.65rem] leading-none">{emoji}</span>
                                        <span>{selectedEmoji === emoji ? "Selected" : "Choose"}</span>
                                    </span>
                                    {selectedEmoji === emoji && <span>•</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                {feedLoading && displayedNotes.length === 0 && (
                    <p className="font-crimson italic" style={{ color: "#7a5a22" }}>
                        Retrieving the records...
                    </p>
                )}
                {feedError && <p className="font-crimson italic" style={{ color: "#8a2510" }}>{feedError}</p>}

                <div className="flex flex-col gap-6 xl:flex-row">
                    <section
                        className="min-w-0 transition-all duration-300 ease-out"
                        style={{ width: isCommentPanelOpen ? "100%" : "100%" }}
                    >
                        <div
  className="transition-all duration-300 ease-out"
  style={{
    columns: isCommentPanelOpen ? "2 320px" : "4 300px",
    gap: "1.25rem",
  }}
>
                            {displayedNotes.map((note) => (
                                <NoteCard
                                    key={note._id}
                                    isCommentsOpen={activeCommentNoteId === note._id}
                                    isLoggedIn={Boolean(token)}
                                    note={note}
                                    onCommentToggle={handleCommentToggle}
                                />
                            ))}
                        </div>

                        {!selectedEmoji && <div ref={loadMoreRef} className="h-8" />}

                        {!selectedEmoji && loading && displayedNotes.length > 0 && (
                            <p className="font-crimson mt-6 text-center italic" style={{ color: "#7a5a22" }}>
                                Loading more notes...
                            </p>
                        )}

                        {selectedEmoji && displayedNotes.length > 0 && (
                            <p className="font-special-elite mt-6 text-center text-[10px] uppercase tracking-[0.25em]" style={{ color: "#8a6a30" }}>
                                Top notes for {selectedEmoji}
                            </p>
                        )}

                        {!selectedEmoji && !hasMore && displayedNotes.length > 0 && (
                            <p className="font-special-elite mt-6 text-center text-[10px] uppercase tracking-[0.25em]" style={{ color: "#8a6a30" }}>
                                End of the ledger
                            </p>
                        )}
                    </section>

                    <div
                        className="transition-all duration-300 ease-out xl:flex-shrink-0"
                        style={{
                            width: isCommentPanelOpen ? "100%" : "0px",
                            maxWidth: isCommentPanelOpen ? "420px" : "0px",
                            opacity: isCommentPanelOpen ? 1 : 0,
                        }}
                    >
                        {isCommentPanelOpen && (
                            <CommentsPanel
                                activeNote={activeNote}
                                commentInput={commentInput}
                                commentsState={commentsState}
                                isLoggedIn={Boolean(token)}
                                onChangeInput={setCommentInput}
                                onClose={handleCloseComments}
                                onLoadMore={handleLoadMoreComments}
                                onSubmit={handleCommentSubmit}
                                onReplySubmit={handleReplySubmit}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
