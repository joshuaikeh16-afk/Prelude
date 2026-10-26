import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById, updateEvent } from "@/app/actions/events";
import { ArrowLeft, Sparkles } from "lucide-react";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  async function saveEvent(formData: FormData) {
    "use server";
    await updateEvent(id, formData);
  }

  return (
    <main className="prelude-page">
      <div className="edit-event-shell">
        <header className="edit-event-header rise">
          <Link
            href={`/events/${id}`}
            aria-label="Back to event"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--accent)]" />
              <span>EVENT SETTINGS</span>
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Edit event
            </h1>
          </div>

          <span className="w-10" />
        </header>

        <form action={saveEvent} className="event-form space-y-4">
          <section className="form-section rise-1">
            <label>
              <span>EVENT NAME</span>
              <input
                name="title"
                defaultValue={event.title}
                maxLength={120}
                required
              />
            </label>

            <div className="form-grid mt-3">
              <label>
                <span>DATE</span>
                <input
                  name="date"
                  type="date"
                  defaultValue={event.date}
                  required
                />
              </label>

              <label>
                <span>TIME</span>
                <input
                  name="time"
                  type="time"
                  defaultValue={event.time ?? ""}
                />
              </label>
            </div>

            <div className="mt-3">
              <label>
                <span>TIMEZONE</span>
                <input
                  name="timezone"
                  defaultValue={event.timezone}
                  required
                />
              </label>
            </div>

            <div className="mt-3">
              <label>
                <span>LOCATION</span>
                <input
                  name="location"
                  defaultValue={event.location ?? ""}
                  placeholder="Where is it happening?"
                />
              </label>
            </div>
          </section>

          <section className="form-section rise-2">
            <label>
              <span>WHAT DO YOU WANT TO ACCOMPLISH?</span>
              <textarea
                name="description"
                defaultValue={event.description ?? ""}
                rows={4}
                maxLength={2000}
                placeholder="What&apos;s important about this event?"
              />
            </label>
          </section>

          <section className="form-section rise-3">
            <label className="toggle-row flex items-center justify-between cursor-pointer">
              <div>
                <strong className="text-sm font-semibold text-[var(--text-primary)]">
                  Priority event
                </strong>
                <p className="text-xs text-[var(--text-muted)]">
                  Keep this event prominent.
                </p>
              </div>

              <input
                type="checkbox"
                name="is_priority"
                defaultChecked={event.is_priority}
                className="h-5 w-5 accent-[var(--accent)] rounded"
              />
            </label>

            <div className="mt-4 pt-3 border-t border-[var(--line)]">
              <label>
                <span>RECURRENCE</span>
                <select
                  name="recurrence"
                  defaultValue={event.recurrence ?? "none"}
                >
                  <option value="none">Never</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>
          </section>

          <section className="form-section rise-4">
            <div className="text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-2">
              SAVINGS
            </div>

            <div className="form-grid">
              <label>
                <span>GOAL</span>
                <input
                  name="savings_goal"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={event.savings_goal ?? ""}
                  placeholder="0"
                />
              </label>

              <label>
                <span>CURRENCY</span>
                <input
                  name="currency_code"
                  defaultValue={event.currency_code ?? "NGN"}
                  maxLength={3}
                />
              </label>
            </div>
          </section>

          <input
            type="hidden"
            name="image_path"
            value={event.image_path ?? ""}
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-98"
          >
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
