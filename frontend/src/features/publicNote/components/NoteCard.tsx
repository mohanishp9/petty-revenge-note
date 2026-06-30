"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, SmilePlus } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { reactToNote, toggleLike } from "@/features/publicNote/publicNoteSlice";
import type { Note } from "@/features/publicNote/types";
import { DEFAULT_REACTIONS, getReactionTotal, formatReactionSummary } from "@/utils/reactionUtils";

export type NoteCardProps = {
  isCommentsOpen: boolean;
  isLoggedIn: boolean;
  note: Note;
  onCommentToggle: (noteId: string) => void;
};

const NoteCard = ({
  isCommentsOpen,
  isLoggedIn,
  note,
  onCommentToggle,
}: NoteCardProps) => {
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
        backgroundColor: "#f2e2b0",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(120,80,20,0.15) 28px)",
        backgroundSize: "100% 28px",
        backgroundPositionY: "6px",
        padding: "1.5rem",
        border: "1px solid rgba(120,80,20,0.2)",
        breakInside: "avoid",
        marginBottom: "1.25rem",
        display: "inline-block",
        width: "100%",
        boxShadow: "2px 4px 12px rgba(10,5,0,0.08)",
      }}
    >
      <div
        className="absolute bottom-0 left-11 top-0 w-px"
        style={{ background: "rgba(180,40,30,0.3)" }}
      />

      <div className="mb-4 flex items-center gap-3 pl-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm text-2xl"
          style={{
            background: "rgba(120,80,20,0.12)",
            border: "1px solid rgba(120,80,20,0.2)",
          }}
        >
          {note.categoryEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-special-elite truncate text-[12px] tracking-wide text-stone-800">
            {note.showUsername ? note.user.username : "Anonymous"}
          </p>
          <p
            className="font-crimson text-[12px] italic"
            style={{ color: "#8a6030" }}
          >
            {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!isLoggedIn && (
          <button
            type="button"
            className="font-special-elite flex-shrink-0 rounded-sm px-2 py-1 text-[9px] uppercase tracking-widest"
            style={{
              border: "1px solid rgba(120,80,20,0.25)",
              color: "#8a6030",
            }}
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        )}
      </div>

      {note.subject && (
        <h2
          className="font-im-fell mb-2 pl-4 text-[20px] italic leading-tight"
          style={{ color: "#1e0f02" }}
        >
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
        style={{
          color: "#7a5020",
          borderBottom: "1px solid rgba(100,60,10,0.15)",
        }}
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
            {userReaction ? (
              <span style={{ fontSize: 16 }}>{userReaction}</span>
            ) : (
              <SmilePlus className="h-4 w-4" />
            )}
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
                  style={{
                    background:
                      userReaction === reaction
                        ? "rgba(120,80,20,0.15)"
                        : "transparent",
                  }}
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

      <div
        className="font-special-elite mt-4 pl-4 text-[9px] uppercase tracking-[0.22em]"
        style={{ color: "#8a6030" }}
      >
        {visibleReactionCount} reactions
      </div>
    </article>
  );
};

export default NoteCard;
