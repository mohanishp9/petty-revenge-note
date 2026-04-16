import { IUser } from "./user.types";

import { Types } from "mongoose";

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: Types.ObjectId;
            };
        }
    }
}
export { };