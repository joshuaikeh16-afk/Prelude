import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById, updateEvent } from "@/app/actions/events";

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
        <header className="edit-event-header">
          <Link href={`/events/${id}`} className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">EVENT</span>
            <h1>Edit event</h1>
          </div>
        </header>

        <form action={saveEvent} className="event-form">
          <section className="event-form-section">
            <label>
              <span>EVENT NAME</span>
              <input
                name="title"
                defaultValue={event.title}
                maxLength={120}
                required
              />
            </label>

            <div className="event-form-row">
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

            <label>
              <span>TIMEZONE</span>
              <input
                name="timezone"
                defaultValue={event.timezone}
                required
              />
            </label>

            <label>
              <span>LOCATION</span>
              <input
                name="location"
                defaultValue={event.location ?? ""}
                placeholder="Where is it happening?"
              />
            </label>
          </section>

          <section className="event-form-section">
            <label>
              <span>WHAT DO YOU WANT TO ACCOMPLISH?</span>
              <textarea
                name="description"
                defaultValue={event.description ?? ""}
                rows={5}
                maxLength={2000}
                placeholder="What's important about this event?"
              />
            </label>
          </section>

          <section className="event-form-section">
            <label className="form-toggle">
              <div>
                <strong>Priority event</strong>
                <small>Keep this event prominent.</small>
              </div>

              <input
                type="checkbox"
                name="is_priority"
                defaultChecked={event.is_priority}
              />
            </label>
          </section>

          <section className="event-form-section">
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
          </section>

          <section className="event-form-section">
            <div className="form-section-heading">
              <span>SAVINGS</span>
              <small>Optional</small>
            </div>

            <div className="event-form-row">
              <label>
                <span>GOAL</span>
                <input
                  name="savings_goal"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    event.savings_goal ?? ""
                  }
                  placeholder="0"
                />
              </label>

              <label>
                <span>CURRENCY</span>
                <input
                  name="currency_code"
                  defaultValue={
                    event.currency_code ?? "NGN"
                  }
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

          <button type="submit" className="event-save-button">
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
