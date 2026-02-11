"use client";

import Link from "next/link";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative">
                <Ghost size={80} className="text-[var(--text-muted)] opacity-50 relative z-10" />
                <div className="absolute inset-0 bg-[var(--accent)] blur-3xl opacity-20 transform scale-150 animate-pulse"></div>
            </div>

            <div className="space-y-2 max-w-sm">
                <h1 className="text-4xl font-bold text-[var(--heading)]">404</h1>
                <h2 className="text-xl font-semibold text-[var(--heading)]">Page not found</h2>
                <p className="text-[var(--text-secondary)]">
                    It seems you&apos;ve wandered off the dedicated path. The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>

            <div className="flex gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] font-medium transition-all hover:scale-105"
                >
                    <Home size={18} />
                    Dashboard
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-medium shadow-lg shadow-[var(--accent-glow)] transition-all hover:scale-105"
                >
                    <ArrowLeft size={18} />
                    Go back
                </button>
            </div>
        </div>
    );
}
