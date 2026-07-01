"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    isDangerous?: boolean;
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "CONFIRM",
    isDangerous = true,
    loading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-black/80 transition-opacity"
                onClick={!loading ? onClose : undefined}
            />
            
            <div className="relative w-full max-w-md transform border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-start gap-4">
                    <div className={`flex shrink-0 p-2 border ${isDangerous ? 'border-[var(--color-term-status-red)] bg-[#1a0505]' : 'border-[var(--color-term-status-green)] bg-[#051a05]'}`}>
                        <AlertTriangle className={`h-6 w-6 ${isDangerous ? 'text-[var(--color-term-status-red)]' : 'text-[var(--color-term-status-green)]'}`} />
                    </div>
                    <div className="mt-1">
                        <h3 className="text-sm font-mono font-bold tracking-widest text-white uppercase">
                            {title}
                        </h3>
                        <div className="mt-3">
                            <p className="text-xs font-mono text-[var(--color-term-text-secondary)] leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="border border-[var(--color-term-border)] bg-transparent px-4 py-2 text-xs font-mono tracking-widest text-white hover:bg-[#111] disabled:opacity-50 transition-colors uppercase"
                    >
                        [ CANCEL ]
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`border px-4 py-2 text-xs font-mono font-bold tracking-widest transition-colors uppercase disabled:opacity-50 ${
                            isDangerous 
                                ? 'border-[var(--color-term-status-red)] bg-[#1a0505] text-[var(--color-term-status-red)] hover:bg-[var(--color-term-status-red)] hover:text-black' 
                                : 'border-[var(--color-term-status-green)] bg-[#051a05] text-[var(--color-term-status-green)] hover:bg-[var(--color-term-status-green)] hover:text-black'
                        }`}
                    >
                        {loading ? 'PROCESSING...' : `[ ${confirmText} ]`}
                    </button>
                </div>
                
                {/* Decorative terminal corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
            </div>
        </div>
    );
}
