"use client";

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast, Toast as ToastType } from "@/lib/toast";

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: "text-green-500 border-green-500/20 bg-green-500/10",
    error: "text-red-500 border-red-500/20 bg-red-500/10",
    info: "text-blue-500 border-blue-500/20 bg-blue-500/10",
    warning: "text-amber-500 border-amber-500/20 bg-amber-500/10",
};

export function Toast({ id, type, message, description, duration }: ToastType) {
    const { removeToast } = useToast();
    const Icon = icons[type];
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Mount animation
        requestAnimationFrame(() => setIsVisible(true));

        // Handle auto-dismiss logic
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => removeToast(id), 300); // Wait for exit animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, removeToast]);

    return (
        <div
            className={`
        pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-6 shadow-lg transition-all duration-300 ease-in-out
        ${colors[type]} glass backdrop-blur-xl
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
            role="alert"
        >
            <div className="flex gap-3">
                <Icon size={20} className="mt-0.5 shrink-0" />
                <div className="grid gap-1">
                    {message && <div className="text-sm font-semibold">{message}</div>}
                    {description && <div className="text-sm opacity-90">{description}</div>}
                </div>
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => removeToast(id), 300);
                }}
                className={`absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 ${colors[type]}`}
            >
                <X size={14} />
            </button>
        </div>
    );
}
