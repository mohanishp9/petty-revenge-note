import { api } from "@/lib/axios";
import { ReactionResponse, ReactionParams } from "./types";

export const reactionApi = async (
    params: ReactionParams
): Promise<ReactionResponse> => {
    const { noteId, emoji } = params;

    const res = await api.post(
        `/protected/notes/${noteId}/reaction`,
        { emoji }
    );

    return res.data;
};