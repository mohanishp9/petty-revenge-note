import { api } from "@/lib/axios";

export const deleteNoteAPI = async (noteId: string): Promise<{ success: true; message: string }> => {
    const res = await api.delete(`/protected/notes/${noteId}`);
    return res.data;
};
