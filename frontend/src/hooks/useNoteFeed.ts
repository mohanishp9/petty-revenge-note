import { useState, useRef, useEffect, useCallback } from "react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { getAllNotes } from "@/features/publicNote/publicNoteSlice";
import { clearTopNotesByEmoji } from "@/features/topNotesByEmoji/topNotesByEmojiSlice";
import type { getNotesParams } from "@/features/publicNote/types";

export const NOTES_PER_PAGE = 12;

type UseNoteFeedParams = {
  hasMore: boolean;
  loading: boolean;
  accessToken: string | null;
  nextCursor?: string | null;
};

export const useNoteFeed = ({ hasMore, loading, accessToken, nextCursor }: UseNoteFeedParams) => {
  const dispatch = useAppDispatch();
  const [sort, setSort] = useState<getNotesParams["sort"] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedEmoji) {
      return;
    }

    dispatch(
      getAllNotes(
        sort
          ? { sort, page, cursor: page > 1 && nextCursor ? nextCursor : undefined, limit: NOTES_PER_PAGE }
          : { page, cursor: page > 1 && nextCursor ? nextCursor : undefined, limit: NOTES_PER_PAGE },
      ),
    );
  }, [dispatch, sort, page, selectedEmoji, accessToken]); // Don't add nextCursor to deps to avoid infinite loops on pagination

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
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, loading, selectedEmoji]);

  const handleSortChange = useCallback((newSort: "mostLiked" | "oldest" | undefined) => {
    if (selectedEmoji) {
      setSelectedEmoji("");
      dispatch(clearTopNotesByEmoji());
    }
    setSort(newSort);
    setPage(1);
  }, [dispatch, selectedEmoji]);

  const handleEmojiSortChange = useCallback((emoji: string, onEmojiChangeCallback?: () => void) => {
    onEmojiChangeCallback?.();
    if (!emoji) {
      setSelectedEmoji("");
      dispatch(clearTopNotesByEmoji());
      setPage(1);
      return;
    }

    setSelectedEmoji(emoji);
    setSort(undefined);
  }, [dispatch]);

  return {
    sort,
    selectedEmoji,
    loadMoreRef,
    handleSortChange,
    handleEmojiSortChange,
  };
};
