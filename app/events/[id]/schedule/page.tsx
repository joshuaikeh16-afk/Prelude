import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getSchedule,
  createScheduleItem,
  deleteScheduleItem,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const schedule = await getSchedule(id);

  async function addScheduleItem(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "");
    const startAt = String(formData.get("startAt") ?? "");
    const endAt = String(formData.get("endAt") ?? "");

    await createScheduleItem(
      id,
      title,
      startAt,
      endAt || null
    );
  }

  async function removeScheduleItem(itemId: string) {
    "use server";

    await deleteScheduleItem(itemId, id);
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="prelude-page">
      <div className="prep-shell schedule-shell">
        <header className="prep-header">
          <Link href={`/events/${id}`} className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">PREPARATION</span>
            <h1>Schedule</h1>
          </div>
        </header>

        <p className="prep-intro">
          Plan what happens and when it happens.
        </p>

        <section className="prep-card schedule-form-card">
          <form action={addScheduleItem}>
            <input
              name="title"
              placeholder="What's happening?"
              maxLength={300}
              required
            />

            <div className="schedule-time-row">
              <label>
                <span>START</span>
                <input
                  name="startAt"
                  type="datetime-local"
                  required
                />
              </label>

              <label>
                <span>END</span>
                <input
                  name="endAt"
                  type="datetime-local"
                />
              </label>
            </div>

            <button type="submit" className="prep-add-button">
              Add to schedule
            </button>
          </form>
        </section>

        <section className="schedule-list">
          {schedule.length === 0 ? (
            <div className="prep-empty">
              <span>◷</span>
              <h2>No schedule yet</h2>
              <p>
                Add the important moments that make up your event day.
              </p>
            </div>
          ) : (
            schedule.map((item) => (
              <article className="schedule-item" key={item.id}>
                <div className="schedule-time">
                  <strong>{formatTime(item.start_at)}</strong>

                  {item.end_at && (
                    <span>{formatTime(item.end_at)}</span>
                  )}
                </div>

                <div className="schedule-line">
                  <span />
                </div>

                <div className="schedule-content">
                  <h2>{item.title}</h2>

                  <form
                    action={removeScheduleItem.bind(
                      null,
                      item.id
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
