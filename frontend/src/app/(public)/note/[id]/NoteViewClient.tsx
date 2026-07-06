"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useAppDispatch } from "@/app/hook/dispatch";
import NoteCard from "@/features/publicNote/components/NoteCard";
import NoteCardSkeleton from "@/components/NoteCardSkeleton";
import { getSingleNoteAPI } from "@/features/publicNote/publicNoteApi";
import { addSingleNote } from "@/features/publicNote/publicNoteSlice";
import { toggleSave } from "@/features/savedNotes/savedNotesSlice";
import CommentsPanel from "@/features/comments/components/CommentsPanel";
import {
  addComment,
  addReply,
  getNoteComments,
  resetComments,
} from "@/features/comments/commentsSlice";

export default function NoteViewClient({ noteId }: { noteId: string }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const { user, accessToken, isInitialized } = useSelector((state: RootState) => state.auth);
    const isLoggedIn = !!accessToken;

    const reduxNote = useSelector((state: RootState) => 
        state.publicNote.notes.find(n => n._id === noteId)
    );

    const commentsState = useSelector((state: RootState) => state.comments);
    const [commentInput, setCommentInput] = useState("");
    const COMMENTS_PER_PAGE = 10;

    useEffect(() => {
        if (isCommentsOpen) {
            dispatch(
                getNoteComments({
                    noteId,
                    page: 1,
                    limit: COMMENTS_PER_PAGE,
                })
            );
        } else {
            dispatch(resetComments());
        }
    }, [isCommentsOpen, dispatch, noteId]);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await getSingleNoteAPI(noteId);
                if (res.success && res.data) {
                    dispatch(addSingleNote(res.data));
                } else {
                    setError("Note not found.");
                }
            } catch (err) {
                setError("Failed to load note.");
            } finally {
                setLoading(false);
            }
        };

        if (!isInitialized) return; // Wait for auth session to load

        if (!reduxNote) {
            fetchNote();
        } else {
            setLoading(false);
        }
    }, [noteId, reduxNote, dispatch, isInitialized]);

    const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!commentInput.trim()) return;

        const action = await dispatch(
            addComment({
                noteId,
                text: commentInput.trim(),
            })
        );

        if (addComment.fulfilled.match(action)) {
            setCommentInput("");
        }
    };

    const handleReplySubmit = async (commentId: string, text: string) => {
        await dispatch(
            addReply({
                commentId,
                text: text.trim(),
            })
        );
    };

    const handleLoadMoreComments = () => {
        if (commentsState.loading || !commentsState.hasMore) return;

        dispatch(
            getNoteComments({
                noteId,
                page: commentsState.page + 1,
                limit: COMMENTS_PER_PAGE,
            })
        );
    };

    return (
        <div>
            <button
                onClick={() => router.push("/home")}
                className="font-special-elite mb-6 text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ color: "#8a6030" }}
            >
                ← Back to Feed
            </button>

            {loading && <NoteCardSkeleton />}

            {error && (
                <div className="py-20 text-center">
                    <p className="font-im-fell text-2xl italic" style={{ color: "#7a5a22" }}>
                        {error}
                    </p>
                </div>
            )}

            {!loading && !error && reduxNote && (
                <div className="mb-4">
                    <NoteCard
                        note={reduxNote}
                        isLoggedIn={isLoggedIn}
                        isCommentsOpen={isCommentsOpen}
                        isSaved={!!reduxNote.isSaved}
                        onCommentToggle={() => setIsCommentsOpen(!isCommentsOpen)}
                        onSaveToggle={(id) => dispatch(toggleSave(id))}
                    />
                </div>
            )}

            {isCommentsOpen && reduxNote && (
                <CommentsPanel
                    activeNote={reduxNote}
                    commentInput={commentInput}
                    commentsState={commentsState}
                    isLoggedIn={isLoggedIn}
                    currentUser={user}
                    onChangeInput={setCommentInput}
                    onClose={() => setIsCommentsOpen(false)}
                    onLoadMore={handleLoadMoreComments}
                    onSubmit={handleCommentSubmit}
                    onReplySubmit={handleReplySubmit}
                />
            )}
        </div>
    );
}
