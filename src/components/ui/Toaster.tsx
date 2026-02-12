"use client";

import { useToast } from "@/lib/toast";
import { Toast } from "./Toast";
import { Z_INDEX } from "@/lib/constants";

export function Toaster() {
    const { toasts } = useToast();

    return (
        <div className="pointer-events-none fixed bottom-0 right-0 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" style={{ zIndex: Z_INDEX.toast }}>
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
}
