import { api } from "@/lib/axios";
import {ToggleLikeParams, ToggleLikeResponse} from "@/features/toggleLike/types";

export const toggleLikeApi = async (params: ToggleLikeParams): Promise<ToggleLikeResponse> => {
    const { noteId } = params;
    const res = await api.post(`/protected/notes/${noteId}/like`)
    return res.data;
}