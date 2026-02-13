"use client";

import { Plus } from "lucide-react";
import { Z_INDEX } from "@/lib/constants";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export default function FAB({ onClick, label = "Add task" }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 ease-out"
      style={{
        right: "max(1rem, var(--safe-area-right))",
        bottom: "max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))",
        zIndex: Z_INDEX.fab,
      }}
      aria-label={label}
      title={label}
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
