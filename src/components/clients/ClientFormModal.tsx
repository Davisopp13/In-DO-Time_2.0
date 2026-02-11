"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createClient, updateClient } from "@/actions/clients";
import type { Client } from "@/types";

const COLOR_OPTIONS = [
  "#84cc16", "#38bdf8", "#c084fc", "#fb923c",
  "#f87171", "#fbbf24", "#34d399", "#818cf8",
];

interface ClientFormModalProps {
  client?: Client | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClientFormModal({ client, open, onClose, onSaved }: ClientFormModalProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(client?.color ?? "#84cc16");
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditing = !!client;

  useEffect(() => {
    if (open) {
      setError("");
      setSaving(false);
      setSelectedColor(client?.color ?? "#84cc16");
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, client]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(formRef.current!);
    formData.set("color", selectedColor);

    const result = isEditing
      ? await updateClient(client!.id, formData)
      : await createClient(formData);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="relative glass p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            {isEditing ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              ref={nameRef}
              id="client-name"
              name="name"
              type="text"
              required
              defaultValue={client?.name ?? ""}
              placeholder="Client name"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="client-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              id="client-email"
              name="email"
              type="email"
              defaultValue={client?.email ?? ""}
              placeholder="client@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="client-rate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Hourly Rate ($)
            </label>
            <input
              id="client-rate"
              name="hourly_rate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={client?.hourly_rate ?? 70}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "var(--heading)" : "transparent",
                    transform: selectedColor === color ? "scale(1.15)" : "scale(1)",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="client-notes" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Notes
            </label>
            <textarea
              id="client-notes"
              name="notes"
              rows={3}
              defaultValue={client?.notes ?? ""}
              placeholder="Additional notes..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-full bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
