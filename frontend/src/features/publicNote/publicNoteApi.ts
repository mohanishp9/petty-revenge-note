import { api } from "@/lib/axios";
import { getAllNotesResponse, getNotesParams } from "@/features/publicNote/types";

export const getAllNotesAPI = async (params: getNotesParams): Promise<getAllNotesResponse> => {
    const res = await api.get("/public/notes", { params });
    return res.data;
};