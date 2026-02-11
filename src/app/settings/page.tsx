import { getClients } from "@/actions/clients";
import ClientList from "@/components/clients/ClientList";

export default async function SettingsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-8">
      <div>
        <p className="trail-marker">Settings</p>
        <h1 className="text-2xl font-semibold text-[var(--heading)] mt-1">
          Settings
        </h1>
      </div>

      {/* Client Management */}
      <ClientList initialClients={clients} />

      {/* Placeholder sections */}
      <div>
        <p className="trail-marker">API Keys</p>
        <div className="glass p-6 mt-3" style={{ borderRadius: "1.25rem" }}>
          <p className="text-[var(--text-muted)] text-sm">
            DObot API key management coming soon.
          </p>
        </div>
      </div>

      <div>
        <p className="trail-marker">Profile</p>
        <div className="glass p-6 mt-3" style={{ borderRadius: "1.25rem" }}>
          <p className="text-[var(--text-muted)] text-sm">
            Profile settings coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
