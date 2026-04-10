export interface ApiResponse {
    success: boolean;
}

export interface ToggleLikeResponse extends ApiResponse {
    liked: boolean;
}

export interface ToggleLikeParams {
    noteId: string;
}

// {
//     "success": true,
//     "liked": true
// }