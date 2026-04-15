import { api } from "@/lib/axios";
import { GetMyNotesResponse } from "@/features/getMyNotes/types";

export const getMyNotesAPI = async (params: {
    page: number;
    limit: number;
}): Promise<GetMyNotesResponse> => {
    const res = await api.get("/protected/notes/me", { params });
    return res.data;
};