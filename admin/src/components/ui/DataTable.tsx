"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface Column<T> {
    header: React.ReactNode | string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
    onHeaderClick?: () => void;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function DataTable<T>({
    data,
    columns,
    loading = false,
    emptyMessage = "No results found.",
    page,
    totalPages,
    onPageChange
}: DataTableProps<T>) {
    return (
        <div className="flex flex-col border border-[var(--color-term-border)] bg-[var(--color-term-surface)]">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-term-border)]">
                    <thead className="bg-[#050505]">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    scope="col"
                                    onClick={col.onHeaderClick}
                                    className={`px-4 py-3 text-left text-xs font-mono tracking-widest uppercase text-[var(--color-term-text-secondary)] border-b border-[var(--color-term-border)] ${col.onHeaderClick ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-term-border)] bg-[var(--color-term-surface)]">
                        {loading && data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center border-b border-[var(--color-term-border)]">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--color-term-accent-cyan)]" />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, i) => (
                                <tr key={i} className="group transition-colors hover:bg-[#111]">
                                    {columns.map((col, j) => (
                                        <td key={j} className="whitespace-nowrap px-4 py-3 text-sm font-mono text-white group-hover:text-[var(--color-term-accent-cyan)] transition-colors">
                                            {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-term-border)] bg-[#050505] px-4 py-2">
                    <div className="text-xs font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase">
                        PAGE <span className="text-white">{page}</span> OF <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] px-3 py-1 text-xs font-mono text-white hover:bg-[#111] disabled:opacity-50 transition-colors uppercase tracking-widest"
                        >
                            &lt; PREV
                        </button>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="border border-[var(--color-term-border)] bg-[var(--color-term-surface)] px-3 py-1 text-xs font-mono text-white hover:bg-[#111] disabled:opacity-50 transition-colors uppercase tracking-widest"
                        >
                            NEXT &gt;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
