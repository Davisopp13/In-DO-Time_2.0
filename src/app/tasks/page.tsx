import { getTasks } from "@/actions/tasks";
import { getActiveProjects } from "@/actions/projects";
import TaskList from "@/components/tasks/TaskList";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getActiveProjects(),
  ]);

  return <TaskList initialTasks={tasks} projects={projects} />;
}
