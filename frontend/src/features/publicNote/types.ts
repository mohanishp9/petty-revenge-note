    export interface Note {
        _id: string;
        user: {
            _id: string;
            username: string;
        };

        showUsername: boolean;
        subject: string;
        content: string;
        categoryEmoji: string;

        likes: number;
        reactionsCount: Record<string, number>;

        commentsCount: number;

        createdAt: string;
        updatedAt: string;


        hasLiked: boolean;
        userReaction: string | null;
    }

    export interface getAllNotesResponse {
        success: boolean;
        count: number;
        data: Note[];
    }

    export interface getAllNotesState {
        notes: Note[];

        loading: boolean;
        error: string | null;

        count: number;
    }

    export interface getNotesParams {
        sort?: "mostLiked" | "oldest"; // optional sorting
        page?: number;
        limit?: number;
    }
    //{
    //     "success": true,
    //     "count": 2,
    //     "data": [
    //         {
    //             "_id": "69ceb75faf2805e572f5fc62",
    //             "user": "69cd564b2d219d5a8dcf3aa4",
    //             "showUsername": true,
    //             "subject": "Shitty Canteen",
    //             "content": "My college canteen is shitty, the worst food I've eaten so far!!!!",
    //             "categoryEmoji": "😡",
    //             "likes": 0,
    //             "reactionsCount": {},
    //             "commentsCount": 0,
    //             "createdAt": "2026-04-02T18:37:19.108Z",
    //             "updatedAt": "2026-04-02T18:37:19.108Z",
    //             "__v": 0,
    //             "hasLiked": false,
    //             "userReaction": null
    //         },
    //         {
    //             "_id": "69cd63b4ba52ff97b7d64bec",
    //             "user": "69cd564b2d219d5a8dcf3aa4",
    //             "showUsername": true,
    //             "subject": "Phone Scam",
    //             "content": "Flipcart Scam Me",
    //             "categoryEmoji": "😡",
    //             "likes": 1,
    //             "reactionsCount": {
    //                 "😂": 1
    //             },
    //             "commentsCount": 2,
    //             "createdAt": "2026-04-01T18:28:04.805Z",
    //             "updatedAt": "2026-04-02T18:38:35.579Z",
    //             "__v": 0,
    //             "hasLiked": false,
    //             "userReaction": null
    //         }
    //     ]
    // }
