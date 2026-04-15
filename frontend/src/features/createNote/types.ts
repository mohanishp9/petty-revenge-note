import { Note } from "@/features/publicNote/types";

export interface CreateNoteParams {
    showUsername: boolean;
    subject: string;
    content: string;
    categoryEmoji: "😂" | "😡" | "😳" | "😭";
}

export interface CreateNoteResponse {
    success: boolean;
    data: Note;
}

export interface CreateNoteState {
    loading: boolean;
    error: string | null;
    success: boolean;
}


// {
//     "success": true,
//     "data": {
//         "user": "69cd564b2d219d5a8dcf3aa4",
//         "showUsername": false,
//         "subject": "Bus Seat Bag",
//         "content": "Someone put their bag on the empty seat beside them. I stood right next to it staring until they moved it with an eye roll 😳",
//         "categoryEmoji": "😳",
//         "likes": 0,
//         "reactionsCount": {},
//         "commentsCount": 0,
//         "_id": "69de4f2767526f64dffc9187",
//         "createdAt": "2026-04-14T14:28:55.859Z",
//         "updatedAt": "2026-04-14T14:28:55.859Z",
//         "__v": 0
//     }
// }