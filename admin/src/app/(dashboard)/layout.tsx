"use client";

import AdminGuard from "@/components/AdminGuard";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex h-screen bg-slate-950">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
            
            <Toaster 
                position="bottom-right" 
                toastOptions={{
                    style: {
                        background: '#0a0a0a',
                        color: '#ffffff',
                        border: '1px solid #1f1f1f',
                        borderRadius: '0px',
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '0.875rem'
                    }
                }}
            />
        </AdminGuard>
    );
}
