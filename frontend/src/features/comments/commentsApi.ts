import { api } from "@/lib/axios";
import {
    CommentsResponse,
    CommentsParams,
    AddCommentParams,
    AddCommentsResponse,
    AddReplyParams,
    AddReplyResponse,
    EditCommentParams,
    EditCommentResponse,
    DeleteCommentParams,
    DeleteCommentResponse
} from "@/features/comments/types";

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

export const addReplyAPI = async ({
    commentId,
    text
}: AddReplyParams): Promise<AddReplyResponse> => {

    const res = await api.post(
        `/protected/notes/comments/${commentId}/reply`,
        { text }
    );

    return res.data;
};

export const editCommentAPI = async ({
    commentId,
    text
}: EditCommentParams): Promise<EditCommentResponse> => {
    const res = await api.put(`/protected/notes/comments/${commentId}`, { text });
    return res.data;
};

export const deleteCommentAPI = async ({
    commentId
}: DeleteCommentParams): Promise<DeleteCommentResponse> => {
    const res = await api.delete(`/protected/notes/comments/${commentId}`);
    return res.data;
};