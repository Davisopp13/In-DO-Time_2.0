import { getNotes } from "@/actions/notes";
import { getActiveProjects } from "@/actions/projects";
import NoteList from "@/components/notes/NoteList";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([
    getNotes(),
    getActiveProjects(),
  ]);

  return <NoteList initialNotes={notes} projects={projects} />;
}
