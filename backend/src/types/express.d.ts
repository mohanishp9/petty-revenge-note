import { Types } from "mongoose";
import type { TokenPayload } from "./session.types";

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: Types.ObjectId;
                username: string;
                email: string;
            };
            sessionId?: string;
            tokenPayload?: TokenPayload;
        }
    }
}

export { };
