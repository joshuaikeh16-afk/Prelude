import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getGoals,
  createGoal,
  deleteGoal,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Target, Trash2 } from "lucide-react";

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const goals = await getGoals(id);

  async function addGoal(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "");
    await createGoal(id, title);
  }

  async function removeGoal(goalId: string) {
    "use server";

    await deleteGoal(goalId, id);
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
              Goals
            </h1>
          </div>
        </header>

        <p className="prep-intro text-sm text-[var(--text-secondary)] mb-4 rise-1">
          What would make {event.title} a success?
        </p>

        {/* Add Goal Form */}
        <section className="prep-card p-4 mb-5 rise-2">
          <form action={addGoal} className="flex flex-col sm:flex-row gap-2.5">
            <input
              name="title"
              placeholder="What would make this event successful?"
              maxLength={300}
              required
              className="flex-1 rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add goal
            </button>
          </form>
        </section>

        {/* Goal List */}
        <section className="goal-list flex flex-col gap-2.5 rise-3">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-10 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-[var(--accent)]">
                <Target size={20} strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                No goals yet
              </h2>
              <p className="mt-1 max-w-[280px] text-xs text-[var(--text-muted)]">
                Add 1 to 3 overarching goals to give your preparation a clear direction.
              </p>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                className="group flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-3.5 transition hover:border-[var(--line-strong)]"
                key={goal.id}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex-shrink-0">
                    <Target size={14} strokeWidth={2.5} />
                  </span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {goal.title}
                  </p>
                </div>

                <form action={removeGoal.bind(null, goal.id)}>
                  <button
                    type="submit"
                    aria-label="Delete goal"
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
