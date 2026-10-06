import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getReminders,
  createReminder,
  deleteReminder,
} from "@/app/actions/reminders";
import { notFound } from "next/navigation";

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
        <header className="prep-header">
          <Link href={`/events/${id}`} className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">PREPARATION</span>
            <h1>Reminders</h1>
          </div>
        </header>

        <p className="prep-intro">
          Get a push reminder when something needs your attention.
        </p>

        <section className="prep-card reminder-form-card">
          <form action={addReminder}>
            <input
              name="title"
              placeholder="What should we remind you about?"
              maxLength={200}
              required
            />

            <label>
              <span>REMIND ME AT</span>
              <input
                name="remindAt"
                type="datetime-local"
                required
              />
            </label>

            <input
              type="hidden"
              name="timezone"
              value="Africa/Lagos"
            />

            <button type="submit" className="prep-add-button">
              Set reminder
            </button>
          </form>
        </section>

        <section className="reminder-list">
          {reminders.length === 0 ? (
            <div className="prep-empty">
              <span>♧</span>
              <h2>No reminders yet</h2>
              <p>
                Set reminders for the things you don't want to
                forget.
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <article className="reminder-item" key={reminder.id}>
                <div className="reminder-icon">♧</div>

                <div className="reminder-content">
                  <h2>{reminder.title}</h2>

                  <p>
                    {formatReminderDate(reminder.remind_at)}
                  </p>

                  <form
                    action={removeReminder.bind(
                      null,
                      reminder.id
                    )}
                  >
                    <button
                      type="submit"
                      className="delete-action"
                    >
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
