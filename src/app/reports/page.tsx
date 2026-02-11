import { getTimeEntries } from "@/actions/time-entries";
import { getProjects } from "@/actions/projects";
import { getClients } from "@/actions/clients";
import ReportsView from "@/components/reports/ReportsView";

export default async function ReportsPage() {
  // Default to "this week" — Monday to Sunday
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split("T")[0];
  const endDate = sunday.toISOString().split("T")[0];

  // End of Sunday for query
  const endOfDay = new Date(sunday);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [entries, projects, clients] = await Promise.all([
    getTimeEntries({
      startDate: monday.toISOString(),
      endDate: endOfDay.toISOString(),
    }),
    getProjects(),
    getClients(),
  ]);

  return (
    <ReportsView
      initialEntries={entries}
      projects={projects}
      clients={clients}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}
