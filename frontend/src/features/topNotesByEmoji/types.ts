import { Note } from "@/features/publicNote/types";

export interface TopNoteItem {
    count: number;
    note: Note;
}

export interface GetTopNoteByEmojiResponse {
    success: boolean;
    count: number;
    data: TopNoteItem[];
    selectedEmoji: string;
}

export interface GetTopNotesByEmojiState {
    data: TopNoteItem[];
    loading: boolean;
    error: string | null;
    selectedEmoji: string | null;
}