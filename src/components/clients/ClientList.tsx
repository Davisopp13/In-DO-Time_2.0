"use client";

import { useState, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import type { Client } from "@/types";
import { archiveClient, restoreClient } from "@/actions/clients";
import ClientCard from "./ClientCard";
import ClientFormModal from "./ClientFormModal";

interface ClientListProps {
  initialClients: Client[];
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients, setClients] = useState(initialClients);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const activeClients = clients.filter((c) => c.status === "active");
  const archivedClients = clients.filter((c) => c.status === "archived");
  const displayedClients = showArchived ? clients : activeClients;

  const handleEdit = useCallback((client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    const result = await archiveClient(id);
    if (result.success) {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "archived" as const } : c))
      );
    }
  }, []);

  const handleRestore = useCallback(async (id: string) => {
    const result = await restoreClient(id);
    if (result.success) {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "active" as const } : c))
      );
    }
  }, []);

  const handleSaved = useCallback(() => {
    // Refetch by reloading — server action already calls revalidatePath
    window.location.reload();
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingClient(null);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="trail-marker">Clients</p>
          <span className="text-xs text-[var(--text-muted)] ml-1">
            ({activeClients.length} active{archivedClients.length > 0 ? `, ${archivedClients.length} archived` : ""})
          </span>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)]"
        >
          <Plus size={14} />
          Add Client
        </button>
      </div>

      {/* Show archived toggle */}
      {archivedClients.length > 0 && (
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-3"
        >
          {showArchived ? "Hide archived" : `Show ${archivedClients.length} archived`}
        </button>
      )}

      {/* Client grid */}
      {displayedClients.length === 0 ? (
        <div className="glass p-8 text-center" style={{ borderRadius: "1.25rem" }}>
          <Users size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">
            No clients yet. Add your first client to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ClientFormModal
        client={editingClient}
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
