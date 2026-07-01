"use client";

import React, { useEffect, useState } from "react";
import { Wrench, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 max-w-2xl w-full">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity rounded-tl-3xl" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-400 opacity-50 group-hover:opacity-100 transition-opacity rounded-br-3xl" />

                    <div className="flex flex-col items-center text-center space-y-8">
                        
                        {/* Animated Icon Cluster */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500 relative z-10 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
                                <Wrench className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '2s' }} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-xl border border-white/20 flex items-center justify-center z-20">
                                <Cpu className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 tracking-tight">
                                SYSTEM UPGRADE IN PROGRESS
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                                We are currently deploying major improvements to the network architecture. 
                                The grid will be back online shortly.
                            </p>
                        </div>

                        {/* Status Terminal */}
                        <div className="w-full bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-left relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-50" />
                            <div className="flex items-center gap-3 text-cyan-400 mb-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span>STATUS: MAINTENANCE_MODE_ACTIVE</span>
                            </div>
                            <div className="text-gray-500 space-y-1">
                                <p>&gt; Rebuilding neural pathways{dots}</p>
                                <p>&gt; Optimizing database clusters{dots}</p>
                                <p>&gt; Securing perimeter walls{dots}</p>
                            </div>
                        </div>

                        <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-medium transition-all hover:scale-105 active:scale-95 group/btn">
                            <ShieldAlert className="w-5 h-5 text-purple-400 group-hover/btn:text-cyan-400 transition-colors" />
                            CHECK STATUS
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
