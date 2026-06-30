"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import NoteCardSkeleton from "@/components/NoteCardSkeleton";
import { useAppDispatch } from "@/app/hook/dispatch";
import {
  addComment,
  addReply,
  getNoteComments,
  resetComments,
} from "@/features/comments/commentsSlice";
import { getCurrentUser } from "@/features/auth/authSlice";
import {
  getTopNotesByEmoji,
} from "@/features/topNotesByEmoji/topNotesByEmojiSlice";
import type { RootState } from "@/store/store";

import { clearSearch } from "@/features/search/searchSlice";
import FeedFilterBar from "@/features/publicNote/components/FeedFilterBar";
import NoteCard from "@/features/publicNote/components/NoteCard";
import CommentsPanel from "@/features/comments/components/CommentsPanel";
import { useNoteFeed, NOTES_PER_PAGE } from "@/hooks/useNoteFeed";
import { useSearchFeed } from "@/hooks/useSearchFeed";

const COMMENTS_PER_PAGE = 10;

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { notes, loading, error, count } = useSelector(
    (state: RootState) => state.publicNote,
  );
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const commentsState = useSelector((state: RootState) => state.comments);
  const searchState = useSelector((state: RootState) => state.search);
  const topNotesByEmoji = useSelector(
    (state: RootState) => state.getTopNotesByEmoji,
  );

  const [activeCommentNoteId, setActiveCommentNoteId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const emojiMenuRef = useRef<HTMLDivElement | null>(null);

  const isSearching = Boolean(searchState.query);
  const hasMore = isSearching ? searchState.hasMore : count === NOTES_PER_PAGE;
  const feedLoading = isSearching ? searchState.loading : (topNotesByEmoji.loading || loading);

  const {
    sort,
    selectedEmoji,
    loadMoreRef,
    handleSortChange: baseHandleSortChange,
    handleEmojiSortChange: baseHandleEmojiSortChange,
  } = useNoteFeed({ hasMore, loading: feedLoading, accessToken });

  const {
    isSearchExpanded,
    setIsSearchExpanded,
    searchInput,
    setSearchInput,
    searchInputRef,
  } = useSearchFeed();

  const displayedNotes = isSearching
    ? searchState.results
    : selectedEmoji
      ? topNotesByEmoji.data.map((item) => item.note)
      : notes;
  const activeNote =
    displayedNotes.find((note) => note._id === activeCommentNoteId) ?? null;
  const isCommentPanelOpen = Boolean(activeCommentNoteId);

  const feedError = isSearching
    ? searchState.error
    : selectedEmoji ? topNotesByEmoji.error : error;

  useEffect(() => {
    if (!accessToken || user) {
      return;
    }
    dispatch(getCurrentUser());
  }, [dispatch, accessToken, user]);

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
    if (!isCommentPanelOpen) {
      dispatch(resetComments());
      return;
    }

    dispatch(
      getNoteComments({
        noteId: activeCommentNoteId!,
        page: 1,
        limit: COMMENTS_PER_PAGE,
      }),
    );
  }, [activeCommentNoteId, dispatch, isCommentPanelOpen]);

  useEffect(() => {
    if (isCommentPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isCommentPanelOpen]);

  const handleSortChange = (newSort: "mostLiked" | "oldest" | undefined) => {
    baseHandleSortChange(newSort);
  };

  const handleEmojiSortChange = (emoji: string) => {
    setActiveCommentNoteId(null);
    setCommentInput("");
    dispatch(resetComments());
    setIsEmojiMenuOpen(false);
    
    baseHandleEmojiSortChange(emoji, () => {
      if (emoji) dispatch(getTopNotesByEmoji(emoji));
    });
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
    if (
      !activeCommentNoteId ||
      commentsState.loading ||
      !commentsState.hasMore
    ) {
      return;
    }

    dispatch(
      getNoteComments({
        noteId: activeCommentNoteId,
        page: commentsState.page + 1,
        limit: COMMENTS_PER_PAGE,
      }),
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
      }),
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
      }),
    );

    if (addReply.fulfilled.match(action)) {
      // Reply was added successfully
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(360deg, #f2e2b0 10%, #f5e9c8 30%, #ede0b0 90%)",
      }}
    >
      <div
        className="px-4 py-5 sm:px-6 lg:px-8"
        style={{ borderBottom: "1px solid rgba(180,130,40,0.15)" }}
      >
        <p
          className="font-special-elite mb-1 text-[10px] uppercase tracking-[0.25em]"
          style={{ color: "#7a5a22" }}
        >
          The Public Ledger
        </p>
        <h1
          className="font-im-fell text-3xl italic sm:text-4xl"
          style={{ color: "#8a6a30" }}
        >
          Petty Revenge Notes
        </h1>
        <p
          className="font-crimson mt-1 text-sm italic sm:text-base"
          style={{ color: "#8a6a30" }}
        >
          - every slight, duly recorded for posterity
        </p>
      </div>

      <FeedFilterBar
        sort={sort}
        handleSortChange={handleSortChange}
        selectedEmoji={selectedEmoji}
        isEmojiMenuOpen={isEmojiMenuOpen}
        setIsEmojiMenuOpen={setIsEmojiMenuOpen}
        emojiMenuRef={emojiMenuRef}
        handleEmojiSortChange={handleEmojiSortChange}
        isSearchExpanded={isSearchExpanded}
        setIsSearchExpanded={setIsSearchExpanded}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        searchInputRef={searchInputRef}
        onClearSearch={() => {
          setSearchInput("");
          dispatch(clearSearch());
        }}
        onToggleSearch={() => {
          const next = !isSearchExpanded;
          setIsSearchExpanded(next);
          if (next) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          } else {
            setSearchInput("");
            dispatch(clearSearch());
          }
        }}
      />

      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        {feedLoading && displayedNotes.length === 0 && (
          <div
            style={{ columns: "4 300px", gap: "1.25rem" }}
          >
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
          </div>
        )}
        {feedError && (
          <p className="font-crimson italic" style={{ color: "#8a2510" }}>
            {feedError}
          </p>
        )}

        <section className="w-full">
          {!feedLoading && isSearching && displayedNotes.length === 0 && (
            <div className="py-20 text-center">
              <h3 className="font-im-fell text-2xl italic" style={{ color: "#5a3210" }}>
                The archives contain no records of &quot;{searchState.query}&quot;.
              </h3>
              <p className="font-crimson mt-2 text-[18px]" style={{ color: "#8a6a30" }}>
                Perhaps the slight was too petty, or the spelling was incorrect.
              </p>
            </div>
          )}
          <div
            className="transition-all duration-300 ease-out"
            style={{
              columns: "4 300px",
              gap: "1.25rem",
            }}
          >
            {displayedNotes.map((note) => (
              <NoteCard
                key={note._id}
                isCommentsOpen={activeCommentNoteId === note._id}
                isLoggedIn={Boolean(accessToken)}
                note={note}
                onCommentToggle={handleCommentToggle}
              />
            ))}
          </div>

          {!selectedEmoji && <div ref={loadMoreRef} className="h-8" />}

          {!selectedEmoji && loading && displayedNotes.length > 0 && (
            <p
              className="font-crimson mt-6 text-center italic"
              style={{ color: "#7a5a22" }}
            >
              Loading more notes...
            </p>
          )}

          {selectedEmoji && displayedNotes.length > 0 && (
            <p
              className="font-special-elite mt-6 text-center text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "#8a6a30" }}
            >
              Top notes for {selectedEmoji}
            </p>
          )}

          {!selectedEmoji && !hasMore && displayedNotes.length > 0 && (
            <p
              className="font-special-elite mt-6 text-center text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "#8a6a30" }}
            >
              End of the ledger
            </p>
          )}
        </section>

        {isCommentPanelOpen && (
          <CommentsPanel
            activeNote={activeNote}
            commentInput={commentInput}
            commentsState={commentsState}
            isLoggedIn={Boolean(accessToken)}
            currentUser={user}
            onChangeInput={setCommentInput}
            onClose={handleCloseComments}
            onLoadMore={handleLoadMoreComments}
            onSubmit={handleCommentSubmit}
            onReplySubmit={handleReplySubmit}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
