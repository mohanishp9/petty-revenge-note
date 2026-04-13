import { api } from "@/lib/axios";
import {CommentsResponse, CommentsParams, AddCommentParams, AddCommentsResponse} from "@/features/comments/types";

export const getAllCommentsAPI = async (
    params: CommentsParams
): Promise<CommentsResponse> => {
    const { noteId, page = 1, limit = 10 } = params;

    const res = await api.get(`/public/notes/${noteId}/comments`, {
        params: { page, limit },
    });

    return res.data;
};

export const addCommentAPI = async ({
    noteId,
    text
}: AddCommentParams): Promise<AddCommentsResponse> => {

    const res = await api.post(
        `/protected/notes/${noteId}/comment`,
        { text }
    );

    return res.data;
};