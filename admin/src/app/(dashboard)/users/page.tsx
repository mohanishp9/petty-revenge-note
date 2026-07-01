"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Search } from "lucide-react";
import { useAppDispatch } from "@/app/hook/dispatch";
import { fetchUsers, PublicUser } from "@/features/users/usersSlice";
import { RootState } from "@/store/store";
import { DataTable } from "@/components/ui/DataTable";

export default function UsersPage() {
    const dispatch = useAppDispatch();
    const { users, loading, total, page, pages } = useSelector((state: RootState) => state.users);
    const [searchTerm, setSearchTerm] = useState("");

    const loadUsers = useCallback((currentPage: number, search: string) => {
        dispatch(fetchUsers({ page: currentPage, search }));
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadUsers(1, searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, loadUsers]);

    const handlePageChange = (newPage: number) => {
        loadUsers(newPage, searchTerm);
    };

    const columns = [
        {
            header: "ID",
            accessorKey: "_id",
            cell: (user: PublicUser) => (
                <span className="text-[var(--color-term-text-secondary)]">{user._id.slice(-6)}</span>
            )
        },
        {
            header: "Username",
            accessorKey: "username",
            cell: (user: PublicUser) => (
                <span className="text-white group-hover:text-[var(--color-term-accent-cyan)] transition-colors">{user.username}</span>
            )
        },
        {
            header: "Email",
            accessorKey: "email"
        },
        {
            header: "Status",
            accessorKey: "isBanned",
            cell: (user: PublicUser) => (
                <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    user.isBanned 
                    ? 'border border-[var(--color-term-status-red)] text-[var(--color-term-status-red)] bg-[#1a0505]' 
                    : 'border border-[var(--color-term-status-green)] text-[var(--color-term-status-green)] bg-[#051a05]'
                }`}>
                    {user.isBanned ? 'BANNED' : 'ACTIVE'}
                </span>
            )
        },
        {
            header: "Joined",
            accessorKey: "createdAt",
            cell: (user: PublicUser) => {
                const date = new Date(user.createdAt);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
        },
        {
            header: "",
            accessorKey: "actions",
            cell: (user: PublicUser) => (
                <Link
                    href={`/users/${user._id}`}
                    className="inline-flex items-center border border-[var(--color-term-border)] bg-[#050505] px-3 py-1 text-[10px] tracking-widest font-bold text-[var(--color-term-accent-cyan)] hover:bg-[#111] hover:border-[var(--color-term-accent-cyan)] transition-colors uppercase"
                >
                    [INSPECT]
                </Link>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-term-border)] pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.USERS</h1>
                    <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">Entity registry and access control.</p>
                </div>
                
                <div className="relative w-full max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-[var(--color-term-text-secondary)]" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        placeholder="QUERY BY USERNAME OR EMAIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full border border-[var(--color-term-border)] bg-[#050505] py-2 pl-10 pr-3 text-white font-mono text-xs uppercase tracking-widest placeholder-[var(--color-term-text-secondary)] focus:outline-none focus:border-[var(--color-term-accent-cyan)] transition-colors"
                    />
                </div>
            </div>

            <DataTable
                data={users}
                columns={columns}
                loading={loading}
                page={page}
                totalPages={pages}
                onPageChange={handlePageChange}
                emptyMessage="NO ENTITIES FOUND MATCHING QUERY."
            />
        </div>
    );
}
