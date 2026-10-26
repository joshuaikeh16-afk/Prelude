import { getEventById } from "@/app/actions/events";
import { getEventTasks } from "@/app/actions/tasks";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { TaskList } from "@/components/TaskList";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  MoreHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

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

  const todayISO = new Date().toISOString().slice(0, 10);
  const isEventDay = event.date === todayISO;
  const isPast = event.status === "past";

  const savingsPercent =
    event.savings_goal && event.savings_goal > 0
      ? Math.min(100, Math.round(((event.saved_amount ?? 0) / event.savings_goal) * 100))
      : 0;

  return (
    <main className="prelude-page">
      <div className="workspace-shell">
        <header className="workspace-header rise">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <span className="workspace-label">
            {isPast ? "MEMORY" : isEventDay ? "TODAY IS THE DAY" : "EVENT WORKSPACE"}
          </span>

          <Link
            href={`/events/${event.id}/edit`}
            aria-label="Edit event options"
            className="workspace-more"
          >
            <MoreHorizontal size={18} strokeWidth={2} />
          </Link>
        </header>

        {/* Hero Section */}
        <section className="workspace-hero rise-1">
          <div className="workspace-cover relative">
            {event.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.image_path}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="workspace-cover-placeholder h-full w-full" />
            )}

            {event.is_priority && (
              <span className="priority-pill">
                Priority
              </span>
            )}
          </div>

          <div className="workspace-title">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {event.title}
            </h1>

            <p className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Calendar size={13} strokeWidth={2} className="text-[var(--accent)]" />
              <span>
                {new Date(`${event.date}T00:00:00`).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>
              {event.time && <span>· {event.time}</span>}
            </p>

            {event.location && (
              <p className="workspace-location flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                <MapPin size={12} strokeWidth={2} />
                <span>{event.location}</span>
              </p>
            )}
          </div>
        </section>

        {/* Countdown / Event-Day Notice */}
        {!isPast && (
          <section className="workspace-countdown rise-2">
            <div className="workspace-section-label">
              {isEventDay ? "EVENT DAY" : "COUNTDOWN"}
            </div>

            <Countdown
              date={event.date}
              time={event.time ?? null}
            />
          </section>
        )}

        {/* Intention Card */}
        {event.description && (
          <section className="workspace-card intention-card rise-3">
            <div className="workspace-section-label">
              WHAT YOU WANT TO ACCOMPLISH
            </div>

            <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">
              &ldquo;{event.description}&rdquo;
            </p>
          </section>
        )}

        {/* Active Preparation Workspace */}
        {!isPast && (
          <>
            {/* Task Preparation */}
            <section className="workspace-card rise-3">
              <div className="workspace-card-header">
                <div>
                  <div className="workspace-section-label">
                    PREPARATION
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Get ready
                  </h2>
                </div>

                <span className="progress-number font-mono text-sm font-semibold text-[var(--accent)]">
                  {progress}% complete
                </span>
              </div>

              <TaskList eventId={event.id} tasks={tasks} />
            </section>

            {/* Preparation Modules 2x2 Grid */}
            <section className="preparation-grid rise-4">
              <Link href={`/events/${event.id}/goals`} className="group">
                <Target
                  size={20}
                  strokeWidth={2}
                  className="mb-2 text-[var(--accent)] transition-transform group-hover:scale-110"
                />
                <strong className="text-sm font-semibold text-[var(--text-primary)]">Goals</strong>
                <small className="text-xs text-[var(--text-muted)]">What matters most</small>
              </Link>

              <Link href={`/events/${event.id}/notes`} className="group">
                <FileText
                  size={20}
                  strokeWidth={2}
                  className="mb-2 text-[var(--accent)] transition-transform group-hover:scale-110"
                />
                <strong className="text-sm font-semibold text-[var(--text-primary)]">Notes</strong>
                <small className="text-xs text-[var(--text-muted)]">Keep details here</small>
              </Link>

              <Link href={`/events/${event.id}/schedule`} className="group">
                <Calendar
                  size={20}
                  strokeWidth={2}
                  className="mb-2 text-[var(--accent)] transition-transform group-hover:scale-110"
                />
                <strong className="text-sm font-semibold text-[var(--text-primary)]">Schedule</strong>
                <small className="text-xs text-[var(--text-muted)]">Plan the day</small>
              </Link>

              <Link href={`/events/${event.id}/reminders`} className="group">
                <Bell
                  size={20}
                  strokeWidth={2}
                  className="mb-2 text-[var(--accent)] transition-transform group-hover:scale-110"
                />
                <strong className="text-sm font-semibold text-[var(--text-primary)]">Reminders</strong>
                <small className="text-xs text-[var(--text-muted)]">Don&rsquo;t forget</small>
              </Link>
            </section>

            {/* Savings Section with Animated Progress Ring */}
            {event.savings_goal !== null && (
              <section className="workspace-card savings-card rise-5 mt-4">
                <div className="workspace-card-header">
                  <div>
                    <div className="workspace-section-label">
                      SAVINGS
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      Prepare financially
                    </h2>
                  </div>
                </div>

                <div className="savings-row">
                  {/* Circular Progress Ring */}
                  <div
                    className="savings-ring"
                    style={
                      {
                        "--progress": savingsPercent,
                      } as React.CSSProperties
                    }
                  >
                    <span>{savingsPercent}%</span>
                  </div>

                  <div>
                    <strong>
                      {event.currency_code}{" "}
                      {Number(event.saved_amount ?? 0).toLocaleString()}
                    </strong>

                    <p>
                      of {event.currency_code}{" "}
                      {Number(event.savings_goal).toLocaleString()} target
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Memory View when event is complete/past */}
        {isPast && (
          <section className="workspace-card memory-placeholder rise-3">
            <div className="workspace-section-label flex items-center gap-1.5">
              <Sparkles size={12} className="text-[var(--accent)]" />
              <span>MEMORY</span>
            </div>

            <div className="flex items-center gap-2 mt-1 mb-2">
              <CheckCircle2 size={20} className="text-[var(--success)]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                This moment happened.
              </h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Your preparation has been preserved. Revisit the tasks, notes and schedule
              that made this day special.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--line)]">
              <Link
                href={`/events/${event.id}/notes`}
                className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-3 text-center transition hover:bg-white/[0.06]"
              >
                <FileText size={16} className="mx-auto mb-1 text-[var(--accent)]" />
                <span className="text-xs font-medium text-[var(--text-primary)]">View Notes</span>
              </Link>

              <Link
                href={`/events/${event.id}/schedule`}
                className="rounded-2xl border border-[var(--line)] bg-white/[0.03] p-3 text-center transition hover:bg-white/[0.06]"
              >
                <Calendar size={16} className="mx-auto mb-1 text-[var(--accent)]" />
                <span className="text-xs font-medium text-[var(--text-primary)]">View Schedule</span>
              </Link>
            </div>
          </section>
        )}

        {/* Actions Footer */}
        <div className="workspace-footer mt-6">
          <Link
            href={`/events/${event.id}/edit`}
            className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
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
