import { getTasks } from "@/actions/tasks";
import { getActiveProjects } from "@/actions/projects";
import { getTodaysTimeSummary } from "@/actions/time-entries";
import { getNotes } from "@/actions/notes";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const [tasks, activeProjects, timeSummary, notes] = await Promise.all([
    getTasks(),
    getActiveProjects(),
    getTodaysTimeSummary(),
    getNotes(),
  ]);

  return (
    <DashboardContent
      initialTasks={tasks}
      initialProjects={activeProjects}
      timeSummary={timeSummary}
      notes={notes}
    />
  );
}
