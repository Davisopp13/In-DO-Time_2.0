"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import type { NoteWithProject } from "@/actions/notes";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, "<em>$1</em>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br/>");
}

interface DashboardJournalProps {
  todaysJournal: NoteWithProject | null;
}

export default function DashboardJournal({ todaysJournal }: DashboardJournalProps) {
  return (
    <div
      className="glass p-5 flex flex-col h-full"
      style={{ borderRadius: "1.25rem" }}
    >
      {/* Trail Marker Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="trail-marker text-xs">▲ Daily Journal</h2>
        <Link
          href="/notes"
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          All Notes →
        </Link>
      </div>

      {todaysJournal ? (
        <div className="flex-1 min-h-0">
          {/* Journal type badge */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(132, 204, 22, 0.13)",
                color: "#84cc16",
              }}
            >
              <BookOpen size={12} />
              Journal
            </div>
            {todaysJournal.title && (
              <span className="text-xs text-[var(--text-secondary)] font-medium truncate">
                {todaysJournal.title}
              </span>
            )}
          </div>

          {/* Content preview */}
          <div
            className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-6 [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)] [&_em]:italic [&_li]:ml-4 [&_li]:list-disc"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(
                todaysJournal.content.length > 300
                  ? todaysJournal.content.slice(0, 300) + "..."
                  : todaysJournal.content
              ),
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-3">
          <BookOpen size={28} className="text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            No journal entry for today yet.
          </p>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus size={14} />
            Start Today&apos;s Journal
          </Link>
        </div>
      )}
    </div>
  );
}
