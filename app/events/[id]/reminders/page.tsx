import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getReminders,
  createReminder,
  deleteReminder,
} from "@/app/actions/reminders";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, Clock, Plus, Trash2 } from "lucide-react";

export default async function RemindersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const reminders = await getReminders(id);

  async function addReminder(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "");
    const remindAt = String(formData.get("remindAt") ?? "");
    const timezone = String(formData.get("timezone") ?? "");

    await createReminder(id, {
      title,
      remindAt,
      timezone,
    });
  }

  async function removeReminder(reminderId: string) {
    "use server";

    await deleteReminder(reminderId, id);
  }

  function formatReminderDate(value: string) {
    return new Date(value).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
              Reminders
            </h1>
          </div>
        </header>

        <p className="prep-intro text-sm text-[var(--text-secondary)] mb-4 rise-1">
          Get a prompt when something needs your attention before {event.title}.
        </p>

        {/* Add Reminder Form */}
        <section className="prep-card p-4 mb-5 rise-2">
          <form action={addReminder} className="flex flex-col gap-3">
            <input
              name="title"
              placeholder="What should we remind you about?"
              maxLength={200}
              required
              className="w-full rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Clock size={12} className="text-[var(--accent)]" />
                REMIND ME AT
              </span>
              <input
                name="remindAt"
                type="datetime-local"
                required
                className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-3.5 py-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
              />
            </label>

            <input
              type="hidden"
              name="timezone"
              value="Africa/Lagos"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 self-end rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Set reminder
            </button>
          </form>
        </section>

        {/* Reminders List */}
        <section className="reminder-list flex flex-col gap-2.5 rise-3">
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-10 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-[var(--accent)]">
                <Bell size={20} strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                No reminders yet
              </h2>
              <p className="mt-1 max-w-[280px] text-xs text-[var(--text-muted)]">
                Set reminders for the things you don&apos;t want to forget.
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                className="group flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-3.5 transition hover:border-[var(--line-strong)]"
                key={reminder.id}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex-shrink-0">
                    <Bell size={15} strokeWidth={2} />
                  </span>
                  <div>
                    <strong className="text-sm font-semibold text-[var(--text-primary)] block">
                      {reminder.title}
                    </strong>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatReminderDate(reminder.remind_at)}
                    </span>
                  </div>
                </div>

                <form action={removeReminder.bind(null, reminder.id)}>
                  <button
                    type="submit"
                    aria-label="Delete reminder"
                    className="grid h-8 w-8 place-items-center rounded-xl text-[var(--text-muted)] opacity-60 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
