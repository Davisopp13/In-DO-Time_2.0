import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { getActiveClients } from "@/actions/clients";
import { getWorkspaces } from "@/actions/workspaces";
import ProjectDetail from "@/components/projects/ProjectDetail";

interface Props {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: Props) {
  const [project, clients, workspaces] = await Promise.all([
    getProject(params.id),
    getActiveClients(),
    getWorkspaces(),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} clients={clients} workspaces={workspaces} />;
}
