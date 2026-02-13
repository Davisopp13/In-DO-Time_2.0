import { getNotes } from "@/actions/notes";
import { getActiveProjects } from "@/actions/projects";
import NoteList from "@/components/notes/NoteList";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([
    getNotes(),
    getActiveProjects(),
  ]);

  return (
    <ErrorBoundary>
      <NoteList initialNotes={notes} projects={projects} />
    </ErrorBoundary>
  );
}
