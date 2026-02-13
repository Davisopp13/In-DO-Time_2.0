"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in duration-300">
                    <div className="relative mb-4">
                        <AlertCircle
                            size={48}
                            className="text-[var(--danger)] opacity-80"
                        />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--heading)] mb-1">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs">
                        This section encountered an error. The rest of the app
                        still works.
                    </p>
                    {process.env.NODE_ENV === "development" &&
                        this.state.error && (
                            <div className="mb-4 p-3 text-left bg-black/20 rounded-lg border border-[var(--border)] overflow-auto max-h-24 text-xs font-mono text-[var(--danger)] max-w-md w-full">
                                {this.state.error.message}
                            </div>
                        )}
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-all active:scale-95"
                    >
                        <RotateCcw size={14} />
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
