"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { FileText, Mail, MessageCircle, NotebookPen, Plus, UserRound, X } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { getCurrentUser, setUserFromStorage } from "@/features/auth/authSlice";
import { getNoteComments, resetComments } from "@/features/comments/commentsSlice";
import type { CommentType } from "@/features/comments/types";
import { createNote, resetCreateNote } from "@/features/createNote/createNoteSlice";
import { getMyNotes, resetMyNotes } from "@/features/getMyNotes/getMyNotesSlice";
import type { Note } from "@/features/publicNote/types";
import type { RootState } from "@/store/store";

const NOTES_PER_PAGE = 12;
const COMMENTS_PER_PAGE = 10;
const CATEGORY_OPTIONS = ["😂", "😡", "😳", "😭"] as const;

const reactionTotal = (counts: Record<string, number>) => Object.values(counts).reduce((sum, value) => sum + value, 0);
const reactionSummary = (counts: Record<string, number>) => {
    const entries = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries.slice(0, 3).map(([emoji, count]) => `${emoji} ${count}`).join("  ") : "No reactions yet";
};
const commentAuthor = (comment: CommentType) => `Witness ${comment.user.slice(-4).toUpperCase()}`;

const paperCard = {
    background: "linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)",
    backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 23px, rgba(100,60,10,0.1) 23px, rgba(100,60,10,0.1) 24px),linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)",
    border: "1px solid rgba(120,80,20,0.2)",
};

function NoteCard({ note, active, onToggle }: { note: Note; active: boolean; onToggle: (id: string) => void }) {
    return (
        <article className="relative rounded-sm p-6 transition duration-300 ease-out" style={{ ...paperCard, minHeight: "26rem" }}>
            <div className="absolute bottom-0 left-11 top-0 w-px" style={{ background: "rgba(180,40,30,0.3)" }} />
            <div className="mb-4 flex items-center gap-3 pl-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm text-2xl" style={{ background: "rgba(120,80,20,0.12)", border: "1px solid rgba(120,80,20,0.2)" }}>{note.categoryEmoji}</div>
                <div className="min-w-0 flex-1">
                    <p className="font-special-elite truncate text-[12px] tracking-wide text-stone-800">{note.showUsername ? note.user.username : "Anonymous"}</p>
                    <p className="font-crimson text-[12px] italic" style={{ color: "#8a6030" }}>{new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            {note.subject && <h2 className="font-im-fell mb-2 pl-4 text-[20px] italic leading-tight" style={{ color: "#1e0f02" }}>{note.subject}</h2>}
            <p className="font-crimson mb-4 pl-4 pr-2 text-[17px] leading-[1.7]" style={{ color: "#3a2008" }}>{note.content}</p>
            <div className="font-crimson mb-4 pl-4 pb-3 text-[13px] italic" style={{ color: "#7a5020", borderBottom: "1px solid rgba(100,60,10,0.15)" }}>{reactionSummary(note.reactionsCount)}</div>
            <div className="flex flex-wrap gap-2 pl-4">
                <span className="font-special-elite rounded-sm px-3 py-2 text-[10px] uppercase tracking-[0.22em]" style={{ border: "1px solid rgba(120,80,20,0.18)", color: "#7a5a22" }}>{note.likes} likes</span>
                <button
                    type="button"
                    onClick={() => onToggle(note._id)}
                    className="font-special-elite flex items-center gap-2 rounded-sm px-3 py-2 text-[10px] uppercase tracking-[0.22em]"
                    style={{ border: `1px solid ${active ? "rgba(150,90,10,0.45)" : "rgba(120,80,20,0.18)"}`, background: active ? "rgba(150,90,10,0.08)" : "transparent", color: active ? "#6e4614" : "#7a5a22" }}
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{note.commentsCount} comments</span>
                </button>
                <span className="font-special-elite rounded-sm px-3 py-2 text-[10px] uppercase tracking-[0.22em]" style={{ border: "1px solid rgba(120,80,20,0.18)", color: "#7a5a22" }}>{reactionTotal(note.reactionsCount)} reactions</span>
                {note.userReaction && <span className="font-special-elite rounded-sm px-3 py-2 text-[10px] uppercase tracking-[0.22em]" style={{ border: "1px solid rgba(160,120,20,0.28)", color: "#7a5010", background: "rgba(160,120,20,0.08)" }}>Reacted {note.userReaction}</span>}
            </div>
        </article>
    );
}

function CommentsPanel({
    activeNote,
    comments,
    commentsLoading,
    commentsHasMore,
    onClose,
    onLoadMore,
}: {
    activeNote: Note | null;
    comments: CommentType[];
    commentsLoading: boolean;
    commentsHasMore: boolean;
    onClose: () => void;
    onLoadMore: () => void;
}) {
    if (!activeNote) return null;
    return (
        <aside className="w-full overflow-hidden rounded-sm border xl:sticky xl:top-24" style={{ background: "linear-gradient(180deg, #f8ecd0 0%, #f2e2b2 100%)", borderColor: "rgba(120,80,20,0.2)", boxShadow: "0 18px 36px rgba(120,80,20,0.08)", maxHeight: "calc(100vh - 7rem)" }}>
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "rgba(120,80,20,0.14)" }}>
                <div>
                    <p className="font-special-elite text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>Note Comments</p>
                    <h2 className="font-im-fell mt-1 text-2xl italic" style={{ color: "#5a3210" }}>{activeNote.subject || "Untitled Note"}</h2>
                    <p className="font-crimson mt-1 text-sm italic" style={{ color: "#8a6030" }}>Read-only comment archive</p>
                </div>
                <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-sm border" style={{ borderColor: "rgba(120,80,20,0.2)", color: "#6a4515" }}><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-5 py-4">
                {commentsLoading && comments.length === 0 && <p className="font-crimson py-8 text-center italic" style={{ color: "#8a6030" }}>Retrieving comments...</p>}
                {!commentsLoading && comments.length === 0 && <p className="font-crimson py-8 text-center italic" style={{ color: "#8a6030" }}>No comments on this note yet.</p>}
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <article key={comment._id} className="rounded-sm border px-4 py-3" style={{ background: "rgba(255,249,236,0.76)", borderColor: "rgba(120,80,20,0.16)" }}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="font-special-elite text-[10px] uppercase tracking-[0.2em]" style={{ color: "#7a5a22" }}>{commentAuthor(comment)}</p>
                                <p className="font-crimson text-xs italic" style={{ color: "#8a6030" }}>{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                            <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a2008" }}>{comment.text}</p>
                        </article>
                    ))}
                </div>
                {commentsHasMore && <button type="button" onClick={onLoadMore} disabled={commentsLoading} className="font-special-elite mt-4 w-full rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]" style={{ border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515", opacity: commentsLoading ? 0.7 : 1 }}>{commentsLoading ? "Loading..." : "Load Older Comments"}</button>}
            </div>
        </aside>
    );
}

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, token, loading: authLoading } = useSelector((state: RootState) => state.auth);
    const { notes, total, loading: notesLoading, error: notesError, page } = useSelector((state: RootState) => state.getMyNote);
    const { comments, loading: commentsLoading, hasMore: commentsHasMore, page: commentsPage } = useSelector((state: RootState) => state.comments);
    const { loading: createNoteLoading, error: createNoteError } = useSelector((state: RootState) => state.createNote);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showUsername, setShowUsername] = useState(true);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [categoryEmoji, setCategoryEmoji] = useState<(typeof CATEGORY_OPTIONS)[number]>("😂");
    const [activeCommentNoteId, setActiveCommentNoteId] = useState<string | null>(null);

    const activeNote = useMemo(() => notes.find((note) => note._id === activeCommentNoteId) ?? null, [activeCommentNoteId, notes]);
    const isCommentPanelOpen = Boolean(activeCommentNoteId);

    useEffect(() => {
        dispatch(setUserFromStorage());
    }, [dispatch]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const hasSession = localStorage.getItem("hasSession") === "true";
        if (!hasSession) {
            router.push("/login");
            return;
        }
        if (!token) return;
        dispatch(getCurrentUser());
        dispatch(resetMyNotes());
        dispatch(getMyNotes({ page: 1, limit: NOTES_PER_PAGE }));
    }, [dispatch, router, token]);

    useEffect(() => {
        if (!activeCommentNoteId) {
            dispatch(resetComments());
            return;
        }
        dispatch(getNoteComments({ noteId: activeCommentNoteId, page: 1, limit: COMMENTS_PER_PAGE }));
    }, [activeCommentNoteId, dispatch]);

    const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!subject.trim() || !content.trim()) return;
        const action = await dispatch(createNote({ showUsername, subject: subject.trim(), content: content.trim(), categoryEmoji }));
        if (createNote.fulfilled.match(action)) {
            setIsCreateModalOpen(false);
            setShowUsername(true);
            setSubject("");
            setContent("");
            setCategoryEmoji("😂");
            dispatch(resetCreateNote());
            dispatch(resetMyNotes());
            dispatch(getMyNotes({ page: 1, limit: NOTES_PER_PAGE }));
        }
    };

    const handleToggleComments = (noteId: string) => {
        if (activeCommentNoteId === noteId) {
            setActiveCommentNoteId(null);
            dispatch(resetComments());
            return;
        }
        setActiveCommentNoteId(noteId);
    };

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(360deg, #f2e2b0 10%, #f5e9c8 30%, #ede0b0 90%)" }}>
            <div className="px-4 py-5 sm:px-6 lg:px-8" style={{ borderBottom: "1px solid rgba(180,130,40,0.15)" }}>
                <p className="font-special-elite mb-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>Private Archive</p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="font-im-fell text-3xl italic sm:text-4xl" style={{ color: "#8a6a30" }}>My Profile & Notes</h1>
                        <p className="font-crimson mt-1 text-sm italic sm:text-base" style={{ color: "#8a6a30" }}>Your recorded identity, alongside every note you have filed so far.</p>
                    </div>
                    <button type="button" onClick={() => { setIsCreateModalOpen(true); dispatch(resetCreateNote()); }} className="font-special-elite flex items-center justify-center gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]" style={{ background: "rgba(122,90,34,0.12)", border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515" }}>
                        <Plus className="h-4 w-4" />
                        <span>Create Note</span>
                    </button>
                </div>
            </div>

            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                <section className="mb-6 rounded-sm border p-6" style={{ background: "linear-gradient(180deg, rgba(250,241,214,0.92) 0%, rgba(243,228,181,0.96) 100%)", borderColor: "rgba(120,80,20,0.18)", boxShadow: "0 18px 36px rgba(120,80,20,0.08)" }}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-sm" style={{ background: "rgba(120,80,20,0.12)", border: "1px solid rgba(120,80,20,0.18)" }}><UserRound className="h-8 w-8" style={{ color: "#6a4515" }} /></div>
                            <div>
                                <p className="font-special-elite text-[10px] uppercase tracking-[0.24em]" style={{ color: "#7a5a22" }}>User Information</p>
                                <h2 className="font-im-fell mt-1 text-3xl italic" style={{ color: "#5a3210" }}>{user?.username || "Loading profile..."}</h2>
                                <div className="font-crimson mt-3 flex flex-col gap-2 text-[15px]" style={{ color: "#5f3b17" }}>
                                    <p className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{user?.email || "Fetching email..."}</span></p>
                                    <p className="flex items-center gap-2"><NotebookPen className="h-4 w-4" /><span>{total} notes recorded</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-sm border px-4 py-3" style={{ borderColor: "rgba(120,80,20,0.14)", background: "rgba(255,249,236,0.52)" }}>
                                <p className="font-special-elite text-[10px] uppercase tracking-[0.24em]" style={{ color: "#7a5a22" }}>Status</p>
                                <p className="font-crimson mt-2 text-base italic" style={{ color: "#5f3b17" }}>{token ? "Logged in and ready to write" : "Checking session"}</p>
                            </div>
                            <div className="rounded-sm border px-4 py-3" style={{ borderColor: "rgba(120,80,20,0.14)", background: "rgba(255,249,236,0.52)" }}>
                                <p className="font-special-elite text-[10px] uppercase tracking-[0.24em]" style={{ color: "#7a5a22" }}>Archive</p>
                                <p className="font-crimson mt-2 text-base italic" style={{ color: "#5f3b17" }}>Personal ledger of revenge notes</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-special-elite text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5a22" }}>My Notes</p>
                            <h3 className="font-im-fell mt-1 text-2xl italic" style={{ color: "#5a3210" }}>Notes You Created</h3>
                        </div>
                        <div className="font-special-elite flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: "#7a5a22" }}><FileText className="h-4 w-4" /><span>{notes.length} shown</span></div>
                    </div>

                    {authLoading && !user && <p className="font-crimson italic" style={{ color: "#7a5a22" }}>Loading profile...</p>}
                    {notesError && <p className="font-crimson italic" style={{ color: "#8a2510" }}>{notesError}</p>}
                    {!notesLoading && notes.length === 0 && <div className="rounded-sm border px-5 py-8" style={{ background: "rgba(250,241,214,0.82)", borderColor: "rgba(120,80,20,0.16)" }}><p className="font-crimson text-center text-lg italic" style={{ color: "#8a6030" }}>No notes created yet.</p></div>}

                    <div className="flex flex-col gap-6 xl:flex-row">
                        <section className="min-w-0 transition-all duration-300 ease-out" style={{ width: "100%" }}>
                            <div className="grid gap-5 transition-all duration-300 ease-out" style={{ gridTemplateColumns: isCommentPanelOpen ? "repeat(auto-fit, minmax(320px, 1fr))" : "repeat(auto-fit, minmax(360px, 1fr))" }}>
                                {notes.map((note) => <NoteCard key={note._id} note={note} active={activeCommentNoteId === note._id} onToggle={handleToggleComments} />)}
                            </div>
                            {notesLoading && notes.length > 0 && <p className="font-crimson mt-6 text-center italic" style={{ color: "#7a5a22" }}>Loading more notes...</p>}
                            {notes.length < total && <div className="mt-6 flex justify-center"><button type="button" onClick={() => !notesLoading && dispatch(getMyNotes({ page: page + 1, limit: NOTES_PER_PAGE }))} disabled={notesLoading} className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]" style={{ background: "rgba(122,90,34,0.12)", border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515", opacity: notesLoading ? 0.7 : 1 }}>{notesLoading ? "Loading..." : "Load More Notes"}</button></div>}
                        </section>

                        <div className="transition-all duration-300 ease-out xl:flex-shrink-0" style={{ width: isCommentPanelOpen ? "100%" : "0px", maxWidth: isCommentPanelOpen ? "420px" : "0px", opacity: isCommentPanelOpen ? 1 : 0 }}>
                            <CommentsPanel
                                activeNote={activeNote}
                                comments={comments}
                                commentsLoading={commentsLoading}
                                commentsHasMore={commentsHasMore}
                                onClose={() => { setActiveCommentNoteId(null); dispatch(resetComments()); }}
                                onLoadMore={() => activeCommentNoteId && !commentsLoading && dispatch(getNoteComments({ noteId: activeCommentNoteId, page: commentsPage + 1, limit: COMMENTS_PER_PAGE }))}
                            />
                        </div>
                    </div>
                </section>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,10,0,0.42)", backdropFilter: "blur(3px)" }}>
                    <div className="relative w-full max-w-4xl">
                        <div className="absolute -left-4 top-8 hidden h-[82%] w-8 rounded-l-md border border-r-0 md:block" style={{ background: "linear-gradient(180deg, #3c250a 0%, #241304 100%)", borderColor: "rgba(30,15,3,0.45)" }} />
                        <div className="absolute left-[-7px] top-16 hidden w-6 md:flex md:flex-col md:gap-4">{Array.from({ length: 11 }).map((_, i) => <span key={i} className="h-4 w-4 rounded-full border" style={{ background: "#120900", borderColor: "#5b3b15" }} />)}</div>
                        <div className="relative overflow-hidden rounded-sm border p-6 md:p-8" style={{ background: "repeating-linear-gradient(180deg, rgba(124,83,20,0.02), rgba(124,83,20,0.02) 33px, rgba(124,83,20,0.14) 33px, rgba(124,83,20,0.14) 34px),linear-gradient(180deg, #f6ebc7 0%, #f2e4ba 48%, #eeddb0 100%)", borderColor: "rgba(120,80,20,0.24)", boxShadow: "0 30px 70px rgba(40,20,0,0.28)" }}>
                            <div className="absolute bottom-0 left-14 top-0 hidden w-px md:block" style={{ background: "rgba(180,40,30,0.28)" }} />
                            <div className="mb-6 flex items-start justify-between gap-4 md:pl-10">
                                <div>
                                    <p className="font-special-elite text-[10px] uppercase tracking-[0.26em]" style={{ color: "#7a5a22" }}>Volume II - Fresh Entry</p>
                                    <h2 className="font-im-fell mt-2 text-3xl italic md:text-4xl" style={{ color: "#4c2810" }}>Compose a New Note</h2>
                                    <p className="font-crimson mt-2 text-sm italic md:text-base" style={{ color: "#8a6030" }}>A proper notebook leaf for documenting your latest petty grievance.</p>
                                </div>
                                <button type="button" onClick={() => { setIsCreateModalOpen(false); dispatch(resetCreateNote()); }} className="flex h-11 w-11 items-center justify-center rounded-sm border" style={{ borderColor: "rgba(120,80,20,0.2)", color: "#6a4515" }}><X className="h-4 w-4" /></button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-6 md:pl-10">
                                <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
                                    <label className="block">
                                        <span className="font-special-elite mb-2 block text-[10px] uppercase tracking-[0.22em]" style={{ color: "#7a5a22" }}>Subject Line</span>
                                        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="font-im-fell w-full border-0 border-b bg-transparent px-0 py-2 text-2xl italic outline-none" style={{ borderBottom: "2px solid rgba(120,80,20,0.18)", color: "#3a2008" }} placeholder="Give this grievance a title" />
                                    </label>
                                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                                        <label className="block">
                                            <span className="font-special-elite mb-2 block text-[10px] uppercase tracking-[0.22em]" style={{ color: "#7a5a22" }}>Mood Seal</span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {CATEGORY_OPTIONS.map((emoji) => (
                                                    <button key={emoji} type="button" onClick={() => setCategoryEmoji(emoji)} className="flex h-12 items-center justify-center rounded-sm border text-2xl" style={{ borderColor: categoryEmoji === emoji ? "rgba(150,90,10,0.42)" : "rgba(120,80,20,0.18)", background: categoryEmoji === emoji ? "rgba(150,90,10,0.08)" : "rgba(255,248,232,0.44)" }}>{emoji}</button>
                                                ))}
                                            </div>
                                        </label>
                                        <div>
                                            <span className="font-special-elite mb-2 block text-[10px] uppercase tracking-[0.22em]" style={{ color: "#7a5a22" }}>Signature</span>
                                            <button type="button" onClick={() => setShowUsername((current) => !current)} className="flex w-full items-center justify-between rounded-full border px-4 py-3" style={{ borderColor: "rgba(120,80,20,0.22)", background: showUsername ? "rgba(132,95,24,0.12)" : "rgba(255,249,236,0.58)" }}>
                                                <span className="font-im-fell text-lg italic" style={{ color: "#5f3b17" }}>{showUsername ? "Signed Publicly" : "Marked Anonymous"}</span>
                                                <span className="flex h-8 w-16 items-center rounded-full border px-1" style={{ borderColor: "rgba(120,80,20,0.2)", background: "rgba(255,249,236,0.72)", justifyContent: showUsername ? "flex-end" : "flex-start" }}>
                                                    <span className="h-6 w-6 rounded-full" style={{ background: showUsername ? "#6f4613" : "#b6945b" }} />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <label className="block">
                                    <span className="font-special-elite mb-2 block text-[10px] uppercase tracking-[0.22em]" style={{ color: "#7a5a22" }}>Main Entry</span>
                                    <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="font-crimson w-full resize-none border-0 bg-transparent px-0 py-2 text-[18px] leading-[1.9] outline-none" style={{ color: "#3a2008" }} placeholder="Write the full account here, as though you were recording it in a real notebook page..." />
                                </label>

                                {createNoteError && <p className="font-crimson italic" style={{ color: "#8a2510" }}>{createNoteError}</p>}

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <button type="button" onClick={() => { setIsCreateModalOpen(false); dispatch(resetCreateNote()); }} className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]" style={{ border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515" }}>Close Page</button>
                                    <button type="submit" disabled={createNoteLoading || !subject.trim() || !content.trim()} className="font-special-elite rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.22em]" style={{ background: "rgba(122,90,34,0.12)", border: "1px solid rgba(120,80,20,0.22)", color: "#6a4515", opacity: createNoteLoading || !subject.trim() || !content.trim() ? 0.7 : 1 }}>{createNoteLoading ? "Inscribing..." : "Create Note"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
