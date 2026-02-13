"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent hydration mismatch — render nothing until client-side theme is known
  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium text-[var(--text-secondary)]">&nbsp;</span>}
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors min-h-[44px] ${
        collapsed ? "justify-center min-w-[44px]" : ""
      }`}
      title={collapsed ? `Switch to ${isDark ? "light" : "dark"} mode` : undefined}
      aria-label={`Currently ${isDark ? "dark" : "light"} mode. Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className="inline-flex flex-shrink-0 transition-transform duration-300"
        style={{ transform: isDark ? "rotate(0deg)" : "rotate(360deg)" }}
      >
        {isDark ? <Moon size={20} /> : <Sun size={20} />}
      </span>
      {!collapsed && (
        <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      )}
    </button>
  );
}
