export interface IAdminUser {
    _id: string;
    name: string;
    email: string;
    password?: string;
    isSuperAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}
