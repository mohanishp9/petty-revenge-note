import { Note } from "@/features/publicNote/types";

export interface ToggleSaveResponse {
    success: boolean;
    saved: boolean;
}

export interface GetSavedNotesResponse {
    success: boolean;
    count: number;
    total: number;
    data: Note[];
}

export interface SavedNotesState {
    // Plain object map of noteId → true for O(1) lookup without breaking Redux serialization
    savedNoteIds: Record<string, true>;

    // The paginated list for the /saved page
    notes: Note[];
    page: number;
    limit: number;
    total: number;

    loading: boolean;
    error: string | null;
}
