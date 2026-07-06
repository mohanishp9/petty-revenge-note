import { api } from "@/lib/axios";
import { ToggleSaveResponse, GetSavedNotesResponse } from "@/features/savedNotes/types";

export const toggleSaveAPI = async (noteId: string): Promise<ToggleSaveResponse> => {
    const res = await api.post(`/protected/notes/${noteId}/save`);
    return res.data;
};

export const getSavedNotesAPI = async (params: {
    page: number;
    limit: number;
}): Promise<GetSavedNotesResponse> => {
    const res = await api.get("/protected/notes/saved", { params });
    return res.data;
};
