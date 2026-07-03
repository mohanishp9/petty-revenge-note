import { api } from "@/lib/axios";

export const fetchCommentsAPI = async (page: number = 1, search: string = "", level: string = "", sort: string = "-createdAt") => {
    const res = await api.get(`/comments?page=${page}&search=${search}&level=${level}&sort=${sort}`);
    return res.data;
};

export const deleteCommentAdminAPI = async (id: string) => {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
};
