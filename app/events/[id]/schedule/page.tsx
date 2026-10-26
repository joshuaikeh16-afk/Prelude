import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getSchedule,
  createScheduleItem,
  deleteScheduleItem,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const schedule = await getSchedule(id);

  // Sort schedule items by start_at
  const sortedSchedule = [...schedule].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );

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

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <main className="prelude-page">
      <div className="prep-shell schedule-shell">
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
              Schedule
            </h1>
          </div>
        </header>

        <p className="prep-intro text-sm text-[var(--text-secondary)] mb-4 rise-1">
          Plan what happens and when it happens during {event.title}.
        </p>

        {/* Add Schedule Item Form Card */}
        <section className="prep-card schedule-form-card p-5 mb-6 rise-2">
          <form action={addScheduleItem} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Moment or activity
              </span>
              <input
                name="title"
                placeholder="What's happening?"
                maxLength={300}
                required
                className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Clock size={12} className="text-[var(--accent)]" />
                  START TIME
                </span>
                <input
                  name="startAt"
                  type="datetime-local"
                  required
                  className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Clock size={12} className="text-[var(--text-muted)]" />
                  END TIME
                </span>
                <input
                  name="endAt"
                  type="datetime-local"
                  className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-md shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add to schedule
            </button>
          </form>
        </section>

        {/* Schedule List */}
        <section className="schedule-list rise-3">
          {sortedSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-10 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-[var(--accent)]">
                <Calendar size={20} strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                No schedule yet
              </h2>
              <p className="mt-1 max-w-[280px] text-xs text-[var(--text-muted)]">
                Add the key moments and timings that make up your event day.
              </p>
            </div>
          ) : (
            sortedSchedule.map((item, index) => {
              // Gentle Overlap detection with previous item
              const prev = sortedSchedule[index - 1];
              const isOverlap =
                prev &&
                prev.end_at &&
                new Date(item.start_at).getTime() < new Date(prev.end_at).getTime();

              return (
                <article className="schedule-item group" key={item.id}>
                  <div className="schedule-time">
                    <strong className="text-sm font-bold text-[var(--text-primary)]">
                      {formatTime(item.start_at)}
                    </strong>

                    {item.end_at ? (
                      <span className="text-xs text-[var(--text-muted)]">
                        to {formatTime(item.end_at)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatDate(item.start_at)}
                      </span>
                    )}
                  </div>

                  <div className="schedule-line">
                    <span />
                  </div>

                  <div className="schedule-content flex-1">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </h2>

                      {/* Gentle overlap indicator badge */}
                      {isOverlap && (
                        <span className="schedule-overlap-warning mt-1.5">
                          <AlertTriangle size={11} strokeWidth={2.5} />
                          Overlaps with previous item
                        </span>
                      )}
                    </div>

                    <form
                      action={removeScheduleItem.bind(null, item.id)}
                    >
                      <button
                        type="submit"
                        aria-label="Delete schedule item"
                        className="grid h-8 w-8 place-items-center rounded-xl text-[var(--text-muted)] opacity-60 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
