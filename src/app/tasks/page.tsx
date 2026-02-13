import { getTasks } from "@/actions/tasks";
import { getActiveProjects } from "@/actions/projects";
import TaskList from "@/components/tasks/TaskList";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getActiveProjects(),
  ]);

  return (
    <ErrorBoundary>
      <TaskList initialTasks={tasks} projects={projects} />
    </ErrorBoundary>
  );
}
