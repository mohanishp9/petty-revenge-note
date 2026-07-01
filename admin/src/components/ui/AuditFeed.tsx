"use client";

import React from "react";
import { AuditLog } from "@/features/dashboard/dashboardSlice";

interface AuditFeedProps {
  logs: AuditLog[];
}

export function AuditFeed({ logs }: AuditFeedProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-[var(--color-term-border)] bg-[var(--color-term-surface)]">
        <span className="text-xs font-mono text-[var(--color-term-text-secondary)] uppercase tracking-widest">
          NO AUDIT LOGS FOUND.
        </span>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes("BAN") && !action.includes("UNBAN")) return "text-[var(--color-term-status-red)]";
    if (action.includes("DELETE") || action.includes("PURGE")) return "text-[var(--color-term-status-red)]";
    return "text-[var(--color-term-status-green)]";
  };

  return (
    <div className="relative border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-6 group">
      <div className="mb-6 border-b border-[var(--color-term-border)] pb-4">
        <h2 className="text-sm font-mono tracking-widest text-white uppercase">
          SYS.AUDIT_LOGS
        </h2>
        <p className="text-[10px] font-mono text-[var(--color-term-text-secondary)] mt-1 tracking-widest uppercase">
          Live stream of destructive operator actions.
        </p>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-[var(--color-term-border)] scrollbar-track-transparent">
        {logs.map((log) => (
          <div key={log._id} className="border-l-2 border-[var(--color-term-border)] pl-4 py-1 hover:border-[var(--color-term-accent-cyan)] transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${getActionColor(log.action)}`}>
                [{log.action}]
              </span>
              <span className="text-[10px] font-mono text-[var(--color-term-text-secondary)]">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            
            <p className="text-xs font-mono text-white mb-2">
              {log.details}
            </p>
            
            <div className="flex gap-4">
                <span className="text-[10px] font-mono text-[var(--color-term-text-secondary)] uppercase">
                  OP: <span className="text-[var(--color-term-accent-cyan)]">{log.adminId?.name || "SYSTEM"}</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--color-term-text-secondary)] uppercase">
                  TARGET ID: {log.targetId}
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
