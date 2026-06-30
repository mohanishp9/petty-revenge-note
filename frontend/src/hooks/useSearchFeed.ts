import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch } from "@/app/hook/dispatch";
import { searchNotes, clearSearch, setSearchQuery } from "@/features/search/searchSlice";
import toast from "react-hot-toast";

export const useSearchFeed = () => {
  const dispatch = useAppDispatch();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    searchAbortControllerRef.current?.abort();

    if (debouncedSearch.trim() === "") {
      dispatch(clearSearch());
      return;
    }

    dispatch(setSearchQuery(debouncedSearch.trim()));
    searchAbortControllerRef.current = new AbortController();

    dispatch(searchNotes({ query: debouncedSearch.trim(), page: 1 })).then((action) => {
      if (searchNotes.rejected.match(action) && action.payload && action.payload !== "aborted") {
        toast.error(action.payload as string);
      }
    });

    return () => { searchAbortControllerRef.current?.abort(); };
  }, [debouncedSearch, dispatch]);

  return {
    isSearchExpanded,
    setIsSearchExpanded,
    searchInput,
    setSearchInput,
    searchInputRef,
  };
};
