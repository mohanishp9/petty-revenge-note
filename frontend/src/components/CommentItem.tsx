"use client";

import { useState } from "react";
import { Reply, Pencil, Trash2, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/app/hook/dispatch";
import { editComment, deleteComment } from "@/features/comments/commentsSlice";
import type { CommentType } from "@/features/comments/types";
import type { RootState } from "@/store/store";

interface CommentItemProps {
    comment: CommentType;
    isLoggedIn: boolean;
    currentUser: any;
    onReplyClick?: (commentId: string) => void;
    replyingTo?: string | null;
    replyInput?: string;
    onReplyInputChange?: (value: string) => void;
    onReplySubmit?: (commentId: string, text: string) => void;
}

const formatCommentAuthor = (comment: CommentType) => `Witness ${comment.user.slice(-4).toUpperCase()}`;

const CommentItem = ({
    comment,
    isLoggedIn,
    currentUser,
    onReplyClick,
    replyingTo,
    replyInput,
    onReplyInputChange,
    onReplySubmit,
}: CommentItemProps) => {
    const dispatch = useAppDispatch();
    const { loading: isCommentsLoading } = useSelector((state: RootState) => state.comments);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isReplying = replyingTo === comment._id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isOwner = currentUser && currentUser._id === comment.user;

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setEditText(comment.text);
    };

    const handleEditSubmit = async () => {
        if (!editText.trim() || editText === comment.text || isCommentsLoading) {
            setIsEditing(false);
            return;
        }

        await dispatch(editComment({ commentId: comment._id, text: editText.trim() }));
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (isCommentsLoading) return;
        setIsDeleting(true);
        await dispatch(deleteComment({ commentId: comment._id }));
        setIsDeleting(false);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="group space-y-2">
            <article
                className="relative overflow-hidden rounded-sm border px-4 py-3"
                style={{
                    background: "rgba(255,249,236,0.76)",
                    borderColor: "rgba(120,80,20,0.16)",
                }}
            >
                {showDeleteConfirm && (
                    <div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center p-2 text-center"
                        style={{
                            background: "rgba(244,231,193,0.96)",
                            backdropFilter: "blur(2px)",
                        }}
                    >
                        <p className="font-crimson mb-3 text-sm italic font-bold" style={{ color: "#8a2510" }}>
                            Permanently delete this comment?
                        </p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="font-special-elite text-[9px] uppercase tracking-[0.2em]"
                                style={{ color: "#7a5a22" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="font-special-elite text-[9px] uppercase tracking-[0.2em]"
                                style={{ color: "#8a2510" }}
                            >
                                {isDeleting ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                )}

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

                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="font-crimson w-full resize-none rounded-sm border bg-transparent px-2 py-2 text-[15px] leading-6 outline-none"
                            style={{ borderColor: "rgba(120,80,20,0.22)", color: "#3a2008" }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleEditToggle}
                                className="font-special-elite text-[9px] uppercase tracking-[0.2em]"
                                style={{ color: "#7a5a22" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSubmit}
                                disabled={!editText.trim() || editText === comment.text || isCommentsLoading}
                                className="font-special-elite text-[9px] uppercase tracking-[0.2em]"
                                style={{ color: "#6a4515", opacity: !editText.trim() || editText === comment.text || isCommentsLoading ? 0.6 : 1 }}
                            >
                                {isCommentsLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="font-crimson text-[15px] leading-7" style={{ color: "#3a2008" }}>
                        {comment.text}
                    </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isLoggedIn && !isEditing && onReplyClick && (
                            <button
                                type="button"
                                onClick={() => onReplyClick(comment._id)}
                                className="flex items-center gap-1.5 font-special-elite text-[9px] uppercase tracking-[0.2em] transition"
                                style={{ color: "#7a5a22", opacity: isReplying ? 0.6 : 1 }}
                            >
                                <Reply className="h-3 w-3" />
                                {isReplying ? "Cancel" : "Reply"}
                            </button>
                        )}
                    </div>

                    {isOwner && !isEditing && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleEditToggle}
                                className="transition hover:scale-110"
                                style={{ color: "#7a5a22" }}
                                title="Edit comment"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="transition hover:scale-110"
                                style={{ color: "#8a2510" }}
                                title="Delete comment"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </article>

            {isReplying && onReplyInputChange && onReplySubmit && (
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
                        onClick={() => onReplySubmit(comment._id, replyInput || "")}
                        disabled={!replyInput?.trim() || isCommentsLoading}
                        className="font-special-elite mt-2 flex items-center gap-2 rounded-sm px-3 py-2 text-[9px] uppercase tracking-[0.2em] transition"
                        style={{
                            background: "rgba(122,90,34,0.12)",
                            border: "1px solid rgba(120,80,20,0.22)",
                            color: "#6a4515",
                            opacity: !replyInput?.trim() || isCommentsLoading ? 0.6 : 1,
                        }}
                    >
                        <Send className={`h-3 w-3 ${isCommentsLoading ? "animate-pulse" : ""}`} />
                        <span>{isCommentsLoading ? "Sending..." : "Send Reply"}</span>
                    </button>
                </div>
            )}

            {hasReplies && (
                <div className="ml-4 space-y-2 border-l-2 pl-3" style={{ borderColor: "rgba(120,80,20,0.12)" }}>
                    {comment.replies!.map((reply) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            isLoggedIn={isLoggedIn}
                            currentUser={currentUser}
                            onReplyClick={onReplyClick}
                            replyingTo={replyingTo}
                            replyInput={replyInput}
                            onReplyInputChange={onReplyInputChange}
                            onReplySubmit={onReplySubmit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
