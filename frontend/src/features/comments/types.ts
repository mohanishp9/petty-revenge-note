export interface ApiResponse {
    success: boolean;
}

export interface CommentType {
    _id: string;
    noteId: string;
    user: string;
    text: string;
    parentCommentId?: string | null;
    repliesCount?: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    replies?: CommentType[];
}

export interface CommentsResponse extends ApiResponse {
    count: number;
    total: number;
    hasMore: boolean;
    comments: CommentType[];
}

export interface CommentsParams {
    noteId: string;
    page?: number;
    limit?: number;
}

export interface CommentsState {
    comments: CommentType[];
    loading: boolean;
    error: string | null;

    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    currentNoteId: string | null;
}

export interface AddCommentParams {
    noteId: string;
    text: string;
}

export interface AddCommentsResponse extends ApiResponse {
    comment: CommentType;
}

export interface AddReplyParams {
    commentId: string;
    text: string;
}

export interface AddReplyResponse extends ApiResponse {
    reply: CommentType;
}

export interface EditCommentParams {
    commentId: string;
    text: string;
}

export interface EditCommentResponse extends ApiResponse {
    comment: CommentType;
}

export interface DeleteCommentParams {
    commentId: string;
}

export interface DeleteCommentResponse extends ApiResponse {
    message: string;
}