import { api } from "@/lib/axios";
import { Note } from "@/features/publicNote/types";

export interface SearchResponse {
    success: boolean;
    count: number;
    total: number;
    data: Note[];
}

export const searchNotesAPI = async (
    query: string,
    page: number,
    signal?: AbortSignal
): Promise<SearchResponse> => {
    const res = await api.get(`/public/notes/search?q=${encodeURIComponent(query)}&page=${page}&limit=12`, {
        signal
    });
    return res.data;
};
