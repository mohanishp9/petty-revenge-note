import { api } from "@/lib/axios";
import { getAllNotesResponse, getNotesParams } from "@/features/publicNote/types";

export const getAllNotesAPI = async (params: getNotesParams): Promise<getAllNotesResponse> => {
    const res = await api.get("/public/notes", { params });
    return res.data;
};

export const trackShareAPI = async (noteId: string): Promise<{ success: boolean; sharesCount: number }> => {
    const res = await api.post(`/public/notes/${noteId}/share`);
    return res.data;
};

export const getSingleNoteAPI = async (noteId: string): Promise<{ success: boolean; data: any }> => {
    const res = await api.get(`/public/notes/${noteId}`);
    return res.data;
};