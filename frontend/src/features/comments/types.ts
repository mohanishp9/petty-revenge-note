export interface ApiResponse {
    success: boolean;
}

export interface CommentType {
    _id: string;
    noteId: string;
    user: string;
    text: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
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

// {
//     "success": true,
//     "count": 3,
//     "total": 3,
//     "hasMore": false,
//     "comments": [
//     {
//         "_id": "69da7a90bbd56789ae7dab10",
//         "noteId": "69d77de6c45b87f16912fe07",
//         "user": "69cd564b2d219d5a8dcf3aa4",
//         "text": "This is so damn relatable",
//         "createdAt": "2026-04-11T16:45:04.179Z",
//         "updatedAt": "2026-04-11T16:45:04.179Z",
//         "__v": 0
//     },
//     {
//         "_id": "69da7a8ebbd56789ae7dab0c",
//         "noteId": "69d77de6c45b87f16912fe07",
//         "user": "69cd564b2d219d5a8dcf3aa4",
//         "text": "This is so damn relatable",
//         "createdAt": "2026-04-11T16:45:02.849Z",
//         "updatedAt": "2026-04-11T16:45:02.849Z",
//         "__v": 0
//     },
//     {
//         "_id": "69da7a8dbbd56789ae7dab08",
//         "noteId": "69d77de6c45b87f16912fe07",
//         "user": "69cd564b2d219d5a8dcf3aa4",
//         "text": "This is so damn relatable",
//         "createdAt": "2026-04-11T16:45:01.542Z",
//         "updatedAt": "2026-04-11T16:45:01.542Z",
//         "__v": 0
//     }
// ]
// }