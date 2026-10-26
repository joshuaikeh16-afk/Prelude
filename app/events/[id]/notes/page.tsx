import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getNotes,
  saveNote,
  deleteNote,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

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
        <header className="prep-header rise">
          <Link
            href={`/events/${id}`}
            aria-label="Back to event"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <div>
            <span className="prep-kicker">PREPARATION</span>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Notes
            </h1>
          </div>
        </header>

        <p className="prep-intro text-sm text-[var(--text-secondary)] mb-4 rise-1">
          Keep useful details about {event.title} in one place.
        </p>

        {/* Add Note Form */}
        <section className="prep-card p-4 mb-5 rise-2">
          <form action={addNote} className="flex flex-col gap-3">
            <textarea
              name="content"
              placeholder="Jot down venue details, packing lists, outfit ideas..."
              maxLength={10000}
              required
              rows={4}
              className="w-full rounded-2xl border border-[var(--line)] bg-white/[0.04] p-3.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 self-end rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Save note
            </button>
          </form>
        </section>

        {/* Notes List */}
        <section className="note-list flex flex-col gap-3 rise-3">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-10 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-[var(--accent)]">
                <FileText size={20} strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                No notes yet
              </h2>
              <p className="mt-1 max-w-[280px] text-xs text-[var(--text-muted)]">
                Add anything you&apos;ll want to remember while preparing.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <article
                className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-4 transition hover:border-[var(--line-strong)]"
                key={note.id}
              >
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2.5 text-xs text-[var(--text-muted)]">
                  <span>
                    Updated {new Date(note.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <form action={removeNote.bind(null, note.id)}>
                    <button
                      type="submit"
                      aria-label="Delete note"
                      className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] opacity-60 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    >
                      <Trash2 size={14} strokeWidth={2} />
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
