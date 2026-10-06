import { getEventById } from "@/app/actions/events";
import { getEventTasks } from "@/app/actions/tasks";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { TaskList } from "@/components/TaskList";

export default async function EventWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const tasks = await getEventTasks(event.id);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  return (
    <main className="prelude-page">
      <div className="workspace-shell">
        <header className="workspace-header">
          <Link href="/dashboard" className="back-button">
            ←
          </Link>

          <span className="workspace-label">
            {event.status === "past" ? "MEMORY" : "EVENT WORKSPACE"}
          </span>

          <Link href={`/events/${event.id}/edit`} className="workspace-more">
            ···
          </Link>
        </header>

        <section className="workspace-hero">
          <div className="workspace-cover">
            {event.image_path ? (
              <img src={event.image_path} alt="" />
            ) : (
              <div className="workspace-cover-placeholder" />
            )}

            {event.is_priority && (
              <span className="priority-pill">Priority</span>
            )}
          </div>

          <div className="workspace-title">
            <h1>{event.title}</h1>

            <p>
              {new Date(`${event.date}T00:00:00`).toLocaleDateString(
                undefined,
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
              {event.time ? ` · ${event.time}` : ""}
            </p>

            {event.location && (
              <p className="workspace-location">
                {event.location}
              </p>
            )}
          </div>
        </section>

        {event.status !== "past" && (
          <section className="workspace-countdown">
            <div className="workspace-section-label">
              COUNTDOWN
            </div>

            <Countdown
              date={event.date}
              time={event.time ?? null}
            />
          </section>
        )}

        {event.description && (
          <section className="workspace-card intention-card">
            <div className="workspace-section-label">
              WHAT YOU WANT TO ACCOMPLISH
            </div>

            <p>{event.description}</p>
          </section>
        )}

        {event.status !== "past" && (
          <>
            <section className="workspace-card">
              <div className="workspace-card-header">
                <div>
                  <div className="workspace-section-label">
                    PREPARATION
                  </div>
                  <h2>Get ready</h2>
                </div>

                <span className="progress-number">
                  {progress}%
                </span>
              </div>

              <TaskList eventId={event.id} tasks={tasks} />
            </section>

            <section className="workspace-card preparation-grid">
              <Link href={`/events/${event.id}/goals`}>
                <span className="preparation-icon">◎</span>
                <strong>Goals</strong>
                <small>What matters most</small>
              </Link>

              <Link href={`/events/${event.id}/notes`}>
                <span className="preparation-icon">≡</span>
                <strong>Notes</strong>
                <small>Keep details here</small>
              </Link>

              <Link href={`/events/${event.id}/schedule`}>
                <span className="preparation-icon">◷</span>
                <strong>Schedule</strong>
                <small>Plan the day</small>
              </Link>

              <Link href={`/events/${event.id}/reminders`}>
                <span className="preparation-icon">♧</span>
                <strong>Reminders</strong>
                <small>Don't forget</small>
              </Link>
            </section>

            {event.savings_goal !== null && (
              <section className="workspace-card savings-card">
                <div className="workspace-card-header">
                  <div>
                    <div className="workspace-section-label">
                      SAVINGS
                    </div>
                    <h2>Prepare financially</h2>
                  </div>
                </div>

                <div className="savings-row">
                  <div className="savings-ring">
                    <span>
                      {Math.round(
                        Math.min(
                          100,
                          ((event.saved_amount ?? 0) /
                            event.savings_goal) *
                            100
                        )
                      )}
                      %
                    </span>
                  </div>

                  <div>
                    <strong>
                      {event.currency_code}{" "}
                      {Number(event.saved_amount ?? 0).toLocaleString()}
                    </strong>

                    <p>
                      of{" "}
                      {event.currency_code}{" "}
                      {Number(event.savings_goal).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {event.status === "past" && (
          <section className="workspace-card memory-placeholder">
            <div className="workspace-section-label">
              MEMORY
            </div>

            <h2>This one happened.</h2>

            <p>
              Your future memories can live here. Add photos and
              revisit what made this event special.
            </p>
          </section>
        )}

        <div className="workspace-footer">
          <Link href={`/events/${event.id}/edit`}>
            Edit event
          </Link>

          <DeleteEventButton
            eventId={event.id}
            title={event.title}
          />
        </div>
      </div>
    </main>
  );
}
