import { Note } from "@/features/publicNote/types";

export interface APIResponse {
    success: boolean;
}

export interface GetMyNotesResponse extends APIResponse {
    count: number;
    total: number;
    data: Note[];
}

export interface GetMyNotesState {
    notes: Note[];

    page: number;
    limit: number;
    total: number;

    loading: boolean;
    error: string | null;
}