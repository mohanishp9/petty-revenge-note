"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";
import { ModerationNote } from "@/features/notes/notesSlice";

interface Report {
    _id: string;
    reason: string;
    details?: string;
    createdAt: string;
    user: {
        _id: string;
        username: string;
        email: string;
    };
}

export default function NoteReportsPage() {
    const params = useParams();
    const router = useRouter();
    const noteId = params.id as string;
    
    const [note, setNote] = useState<ModerationNote | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get(`/notes/${noteId}/reports`);
                setNote(res.data.note);
                setReports(res.data.reports);
            } catch (error: any) {
                toast.error(error.response?.data?.message || "FAILED TO LOAD REPORTS");
            } finally {
                setLoading(false);
            }
        };

        if (noteId) {
            fetchReports();
        }
    }, [noteId]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-[var(--color-term-accent-cyan)] font-mono animate-pulse">LOADING...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="text-[var(--color-term-status-red)] font-mono p-6">
                NOTE NOT FOUND OR HAS BEEN PURGED.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between border-b border-[var(--color-term-border)] pb-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/notes')}
                        className="text-[var(--color-term-text-secondary)] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase">SYS.CONTENT_REPORTS</h1>
                        <p className="mt-1 text-xs font-mono text-[var(--color-term-text-secondary)] uppercase">Detailed Moderation Queue</p>
                    </div>
                </div>
            </div>

            {/* Note Details Readonly */}
            <div className="border border-[var(--color-term-border)] bg-[#050505] p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-term-accent-cyan)]">{note.subject || "NO SUBJECT"}</h2>
                        <div className="text-xs font-mono text-[var(--color-term-text-secondary)] mt-1">
                            AUTHOR: {note.user?.username} ({note.user?.email}) | CREATED: {new Date(note.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-[#1a0505] border border-[var(--color-term-status-red)] text-[var(--color-term-status-red)] px-3 py-1 font-mono font-bold text-xs">
                        TOTAL REPORTS: {reports.length}
                    </div>
                </div>
                
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 text-white/80 whitespace-pre-wrap">
                    {note.content}
                </div>

                <div className="flex gap-6 text-xs font-mono text-[var(--color-term-text-secondary)] border-t border-[#1f1f1f] pt-4 mt-4">
                    {/* Notice: Counts like likesCount would ideally come from the note object if available, we fallback to N/A if not available on the admin model directly without population */}
                    <span>LIKES: {(note as any).likesCount ?? "N/A"}</span>
                    <span>COMMENTS: {(note as any).commentsCount ?? "N/A"}</span>
                    <span>SHARES: {(note as any).sharesCount ?? "N/A"}</span>
                    <span>SAVES: {(note as any).savesCount ?? "N/A"}</span>
                </div>
            </div>

            {/* Reports List */}
            <div className="mt-8">
                <h3 className="text-md font-bold tracking-tight text-white uppercase mb-4 border-b border-[#1f1f1f] pb-2 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-[var(--color-term-status-red)]" />
                    Report Details
                </h3>
                
                {reports.length === 0 ? (
                    <div className="text-[var(--color-term-text-secondary)] font-mono text-sm">NO REPORTS FILED.</div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report._id} className="border border-[#1f1f1f] bg-[#0a0a0a] p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center">
                                        <span className="bg-[var(--color-term-status-red)] text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                                            {report.reason}
                                        </span>
                                        <span className="text-[10px] font-mono text-[var(--color-term-text-secondary)]">
                                            REPORTED BY {report.user?.email || "UNKNOWN"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[var(--color-term-text-secondary)]">
                                        {new Date(report.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                
                                {report.details ? (
                                    <div className="text-sm text-white/80 mt-2 bg-[#121212] p-3 border border-[#1f1f1f]">
                                        <span className="text-[10px] text-[var(--color-term-text-secondary)] block mb-1">USER DETAILS:</span>
                                        {report.details}
                                    </div>
                                ) : (
                                    <div className="text-xs text-[var(--color-term-text-secondary)] mt-2 italic">
                                        No additional details provided.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
