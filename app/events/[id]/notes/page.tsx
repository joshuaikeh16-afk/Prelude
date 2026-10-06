import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getNotes,
  saveNote,
  deleteNote,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const notes = await getNotes(id);

  async function addNote(formData: FormData) {
    "use server";

    const content = String(formData.get("content") ?? "");
    await saveNote(null, id, content);
  }

  async function removeNote(noteId: string) {
    "use server";

    await deleteNote(noteId, id);
  }

  return (
    <main className="prelude-page">
      <div className="prep-shell">
        <header className="prep-header">
          <Link href={`/events/${id}`} className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">PREPARATION</span>
            <h1>Notes</h1>
          </div>
        </header>

        <p className="prep-intro">
          Keep useful details about {event.title} in one place.
        </p>

        <section className="prep-card note-form-card">
          <form action={addNote}>
            <textarea
              name="content"
              placeholder="Write something..."
              maxLength={10000}
              required
              rows={5}
            />

            <button type="submit" className="prep-add-button">
              Save note
            </button>
          </form>
        </section>

        <section className="note-list">
          {notes.length === 0 ? (
            <div className="prep-empty">
              <span>≡</span>
              <h2>No notes yet</h2>
              <p>
                Add anything you'll want to remember while preparing.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <article className="note-item" key={note.id}>
                <p>{note.content}</p>

                <div className="note-footer">
                  <span>
                    {new Date(note.updated_at).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </span>

                  <form action={removeNote.bind(null, note.id)}>
                    <button type="submit" className="delete-action">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
