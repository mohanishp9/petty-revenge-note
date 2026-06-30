"use client";

import { RefObject } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { DEFAULT_REACTIONS } from "@/utils/reactionUtils";

export type FeedFilterBarProps = {
  sort: "mostLiked" | "oldest" | undefined;
  handleSortChange: (sort: "mostLiked" | "oldest" | undefined) => void;
  selectedEmoji: string;
  isEmojiMenuOpen: boolean;
  setIsEmojiMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  emojiMenuRef: RefObject<HTMLDivElement | null>;
  handleEmojiSortChange: (emoji: string) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  searchInput: string;
  setSearchInput: (val: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onClearSearch: () => void;
  onToggleSearch: () => void;
};

const FeedFilterBar = ({
  sort,
  handleSortChange,
  selectedEmoji,
  isEmojiMenuOpen,
  setIsEmojiMenuOpen,
  emojiMenuRef,
  handleEmojiSortChange,
  isSearchExpanded,
  setIsSearchExpanded,
  searchInput,
  setSearchInput,
  searchInputRef,
  onClearSearch,
  onToggleSearch,
}: FeedFilterBarProps) => {
  return (
    <>
      <div
        className="flex flex-wrap gap-2 px-4 py-4 sm:px-6 lg:px-8"
        style={{ borderBottom: "1px solid rgba(180,130,40,0.1)" }}
      >
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
              background:
                sort === value ? "rgba(180,130,40,0.12)" : "transparent",
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
              background: selectedEmoji
                ? "rgba(180,130,40,0.12)"
                : "transparent",
              color: "#8a6a30",
            }}
          >
            <span>Top By Emoji</span>
            <span
              className="flex min-w-[72px] items-center justify-center rounded-sm px-3 py-1.5 normal-case tracking-normal"
              style={{
                background: selectedEmoji
                  ? "rgba(180,130,40,0.18)"
                  : "rgba(180,130,40,0.08)",
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
                  background: !selectedEmoji
                    ? "rgba(180,130,40,0.14)"
                    : "transparent",
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
                    background:
                      selectedEmoji === emoji
                        ? "rgba(180,130,40,0.14)"
                        : "transparent",
                    color: "#6a4515",
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[1.65rem] leading-none">{emoji}</span>
                    <span>
                      {selectedEmoji === emoji ? "Selected" : "Choose"}
                    </span>
                  </span>
                  {selectedEmoji === emoji && <span>•</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Search Bar — sits below the filter bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 sm:px-6 lg:px-8"
        style={{ borderBottom: "1px solid rgba(180,130,40,0.1)" }}
      >
        <div
          className={`relative flex items-center overflow-hidden transition-all duration-300 ease-out ${
            isSearchExpanded ? "w-56 opacity-100" : "w-0 opacity-0"
          }`}
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search the ledger..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsSearchExpanded(false);
                onClearSearch();
              }
            }}
            className="font-crimson w-full rounded-sm px-3 py-1.5 text-sm outline-none"
            style={{
              background: "rgba(180,130,40,0.08)",
              border: "1px solid rgba(180,130,40,0.25)",
              color: "#3a2008",
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "#8a6a30" }}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleSearch}
          className="font-special-elite flex h-[38px] w-[38px] items-center justify-center rounded-sm transition hover:scale-105"
          style={{
            border: `1px solid ${isSearchExpanded ? "rgba(180,130,40,0.6)" : "rgba(180,130,40,0.25)"}`,
            background: isSearchExpanded ? "rgba(180,130,40,0.12)" : "transparent",
            color: "#8a6a30",
          }}
          aria-label="Toggle search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};

export default FeedFilterBar;
