import { getProjects } from "@/actions/projects";
import { getActiveClients } from "@/actions/clients";
import { getWorkspaces } from "@/actions/workspaces";
import ProjectList from "@/components/projects/ProjectList";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function ProjectsPage() {
  const [projects, clients, workspaces] = await Promise.all([
    getProjects(),
    getActiveClients(),
    getWorkspaces(),
  ]);

  return (
    <ErrorBoundary>
      <ProjectList
        initialProjects={projects}
        clients={clients}
        workspaces={workspaces}
      />
    </ErrorBoundary>
  );
}
