"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/workspace";

interface DashboardGreetingProps {
  tasksRemaining: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardGreeting({ tasksRemaining }: DashboardGreetingProps) {
  const [mounted, setMounted] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    setMounted(true);
  }, []);

  const greeting = mounted ? getGreeting() : "Welcome";
  const date = mounted ? formatDate() : "";

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--heading)]">
        {greeting}, Davis
        {currentWorkspace && (
          <span
            className="ml-3 text-[var(--accent)] opacity-80"
            style={{ color: currentWorkspace.color }}
          >
            — {currentWorkspace.name}
          </span>
        )}
      </h1>
      <p className="text-sm font-medium text-[var(--text-secondary)] mt-2 flex items-center gap-2">
        <span className="trail-marker mb-0">{date}</span>
        {tasksRemaining > 0 && (
          <>
            <span className="opacity-30">•</span>
            <span className="text-[var(--text-primary)]">
              {tasksRemaining} task{tasksRemaining !== 1 ? "s" : ""} remaining
            </span>
          </>
        )}
        {tasksRemaining === 0 && (
          <>
            <span className="opacity-30">•</span>
            <span className="text-[var(--success)] font-bold">All caught up!</span>
          </>
        )}
      </p>
    </div>
  );
}
