import { api } from "@/lib/axios";
import { GetTopNoteByEmojiResponse } from "@/features/topNotesByEmoji/types";

export const getTopNoteByEmojiAPI = async (
    emoji: string
): Promise<GetTopNoteByEmojiResponse> => {
    const res = await api.get(`/public/notes/top`, {
        params: { emoji },
    });

    return res.data;
}