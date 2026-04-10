export interface ApiResponse {
    success: boolean;
}

export interface ReactionResponse extends ApiResponse {
    reacted: boolean;
    emoji: string | null;
}

export interface ReactionParams {
    noteId: string;
    emoji: string | null;
}

// {
//     "success": true,
//     "reacted": true,
//     "emoji": "😂"
// }
