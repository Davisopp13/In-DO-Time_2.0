"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative">
                <AlertCircle size={80} className="text-[var(--danger)] opacity-80 relative z-10" />
                <div className="absolute inset-0 bg-[var(--danger)] blur-3xl opacity-20 transform scale-150 animate-pulse"></div>
            </div>

            <div className="space-y-2 max-w-md">
                <h1 className="text-3xl font-bold text-[var(--heading)]">Something went wrong!</h1>
                <p className="text-[var(--text-secondary)]">
                    We encountered an unexpected error. Don&apos;t worry, your data is safe.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-4 p-4 text-left bg-black/20 rounded-lg border border-[var(--border)] overflow-auto max-h-40 text-xs font-mono text-[var(--danger)]">
                        {error.message}
                        {error.digest && <div className="mt-1 opacity-70">Digest: {error.digest}</div>}
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-medium shadow-lg shadow-[var(--accent-glow)] transition-all hover:scale-105"
                >
                    <RotateCcw size={18} />
                    Try again
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] font-medium transition-all hover:scale-105"
                >
                    <Home size={18} />
                    Go home
                </Link>
            </div>
        </div>
    );
}
