"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send, X } from "lucide-react";
import type { CommentsState } from "@/features/comments/types";
import type { Note } from "@/features/publicNote/types";
import CommentItem from "@/components/CommentItem";
import { formatReactionSummary } from "@/utils/reactionUtils";

export type CommentsPanelProps = {
  activeNote: Note | null;
  commentInput: string;
  commentsState: CommentsState;
  isLoggedIn: boolean;
  currentUser: unknown;
  onChangeInput: (value: string) => void;
  onClose: () => void;
  onLoadMore: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReplySubmit: (commentId: string, text: string) => void;
};

const CommentsPanel = ({
  activeNote,
  commentInput,
  commentsState,
  isLoggedIn,
  currentUser,
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
    <>
      {/* Blurred background overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(20,10,0,0.35)",
          backdropFilter: "blur(3px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl" style={{ height: "82vh" }}>
          {/* Modal content - split layout */}
          <div
            className="flex flex-row h-full gap-0"
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
            }}
          >
            {/* Left side - Original Note */}
            <div
              className="flex flex-col border-b lg:border-b-0 lg:border-r lg:w-1/2 overflow-hidden"
              style={{ borderColor: "rgba(120,80,20,0.14)" }}
            >
              <div className="px-6 py-5 flex-shrink-0">
                <p
                  className="font-special-elite text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: "#7a5a22" }}
                >
                  Original Note
                </p>
                <h3
                  className="font-im-fell mt-2 text-xl italic"
                  style={{ color: "#5a3210" }}
                >
                  {activeNote.subject || "Untitled Note"}
                </h3>
              </div>

              {/* Note preview with scroll */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
                <div
                  className="rounded-sm border p-4 mb-4"
                  style={{
                    background:
                      "linear-gradient(170deg, #f2e2b0 0%, #f5e9c8 40%, #ede0b0 100%)",
                    borderColor: "rgba(120,80,20,0.2)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm text-lg"
                      style={{
                        background: "rgba(120,80,20,0.12)",
                        border: "1px solid rgba(120,80,20,0.2)",
                      }}
                    >
                      {activeNote.categoryEmoji}
                    </div>
                    <div>
                      <p className="font-special-elite text-[11px] tracking-wide text-stone-800">
                        {activeNote.showUsername
                          ? activeNote.user.username
                          : "Anonymous"}
                      </p>
                      <p
                        className="font-crimson text-[11px] italic"
                        style={{ color: "#8a6030" }}
                      >
                        {new Date(activeNote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {activeNote.subject && (
                    <h4
                      className="font-im-fell mb-2 text-[18px] italic"
                      style={{ color: "#1e0f02" }}
                    >
                      {activeNote.subject}
                    </h4>
                  )}

                  <p
                    className="font-crimson text-[16px] leading-[1.7]"
                    style={{ color: "#3a2008" }}
                  >
                    {activeNote.content}
                  </p>

                  <div
                    className="font-crimson mt-4 pt-3 text-[12px] italic"
                    style={{
                      color: "#7a5020",
                      borderTop: "1px solid rgba(100,60,10,0.15)",
                    }}
                  >
                    {formatReactionSummary(activeNote.reactionsCount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Comments */}
            <div
              className="flex flex-col lg:w-1/2 rounded-sm overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #f8ecd0 0%, #f2e2b2 100%)",
                border: "1px solid rgba(120,80,20,0.25)",
                boxShadow: "8px 12px 48px rgba(10,5,0,0.6), 0 4px 16px rgba(10,5,0,0.4), inset 0 1px 0 rgba(255,240,180,0.4)",
                height: "100%",
              }}
            >
              <div
                className="flex items-start justify-between gap-3 border-b px-6 py-5 flex-shrink-0"
                style={{ borderColor: "rgba(120,80,20,0.14)" }}
              >
                <div>
                  <p
                    className="font-special-elite text-[10px] uppercase tracking-[0.25em]"
                    style={{ color: "#7a5a22" }}
                  >
                    Comments
                  </p>
                  <p
                    className="font-crimson mt-2 text-sm italic"
                    style={{ color: "#8a6030" }}
                  >
                    {activeNote.commentsCount}{" "}
                    {activeNote.commentsCount === 1 ? "comment" : "comments"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-sm border flex-shrink-0"
                  style={{
                    borderColor: "rgba(120,80,20,0.2)",
                    color: "#6a4515",
                  }}
                  aria-label="Close comments"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className="overflow-y-auto px-6 py-4"
                style={{ height: "calc(100% - 180px)" }}
              >
                {commentsState.loading &&
                  commentsState.comments.length === 0 && (
                    <div
                      className="flex items-center justify-center py-10"
                      style={{ color: "#8a6030" }}
                    >
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </div>
                  )}

                {!commentsState.loading &&
                  commentsState.comments.length === 0 && (
                    <p
                      className="font-crimson py-8 text-center italic"
                      style={{ color: "#8a6030" }}
                    >
                      No comments yet. Start the thread.
                    </p>
                  )}

                <div className="space-y-3">
                  {commentsState.comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      isLoggedIn={isLoggedIn}
                      currentUser={currentUser}
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
                    {commentsState.loading
                      ? "Loading..."
                      : "Load Older Comments"}
                  </button>
                )}
              </div>

              <div
                className="border-t px-6 py-4 flex-shrink-0"
                style={{ borderColor: "rgba(120,80,20,0.14)" }}
              >
                <form onSubmit={onSubmit} className="space-y-3">
                  <textarea
                    value={commentInput}
                    onChange={(event) => onChangeInput(event.target.value)}
                    placeholder={
                      isLoggedIn
                        ? "Write your comment..."
                        : "Login to add a comment"
                    }
                    disabled={!isLoggedIn}
                    rows={3}
                    className="font-crimson w-full resize-none rounded-sm border bg-transparent px-3 py-3 text-[14px] leading-6 outline-none"
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
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentsPanel;
