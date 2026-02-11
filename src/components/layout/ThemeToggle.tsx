"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200 ${
        collapsed ? "justify-center" : ""
      }`}
      title={collapsed ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : undefined}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun size={20} className="flex-shrink-0" />
      ) : (
        <Moon size={20} className="flex-shrink-0" />
      )}
      {!collapsed && (
        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}
