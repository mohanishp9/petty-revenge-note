import { api } from "@/lib/axios";
import { CreateNoteResponse, CreateNoteParams  } from "@/features/createNote/types";

export const createNoteAPI = async (data: CreateNoteParams): Promise<CreateNoteResponse>  => {
    const res = await api.post("/protected/notes", data);
    return res.data;
};