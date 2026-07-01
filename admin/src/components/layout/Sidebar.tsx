"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { name: "OVERVIEW", href: "/" },
    { name: "USERS", href: "/users" },
    { name: "NOTES", href: "/notes" },
    { name: "PROFILE", href: "/profile" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex w-56 flex-col bg-[var(--color-term-surface)] border-r border-[var(--color-term-border)]">
            <div className="flex h-14 shrink-0 items-center px-6 border-b border-[var(--color-term-border)]">
                <span className="text-lg font-bold tracking-tight text-white uppercase">TERMINAL</span>
            </div>
            
            <nav className="flex flex-1 flex-col py-6 overflow-y-auto">
                <ul role="list" className="flex flex-1 flex-col">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                                        group flex items-center px-6 py-2 text-xs font-mono tracking-widest uppercase transition-colors relative
                                        ${isActive 
                                            ? "text-white" 
                                            : "text-[var(--color-term-text-secondary)] hover:text-white"
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-pulse-gradient" />
                                    )}
                                    <span className={isActive ? "text-pulse-gradient font-bold" : ""}>
                                        {item.name}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
