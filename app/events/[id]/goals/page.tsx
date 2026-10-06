import Link from "next/link";
import { getEventById } from "@/app/actions/events";
import {
  getGoals,
  createGoal,
  deleteGoal,
} from "@/app/actions/preparation";
import { notFound } from "next/navigation";

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
        <header className="prep-header">
          <Link href={`/events/${id}`} className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">PREPARATION</span>
            <h1>Goals</h1>
          </div>
        </header>

        <p className="prep-intro">
          What do you want this event to accomplish?
        </p>

        <section className="prep-card">
          <form action={addGoal}>
            <input
              name="title"
              placeholder="Add a goal..."
              maxLength={300}
              required
            />

            <button type="submit" className="prep-add-button">
              Add goal
            </button>
          </form>
        </section>

        <section className="goal-list">
          {goals.length === 0 ? (
            <div className="prep-empty">
              <span>◎</span>
              <h2>No goals yet</h2>
              <p>
                Add a few things that would make this event successful.
              </p>
            </div>
          ) : (
            goals.map((goal) => (
              <div className="goal-item" key={goal.id}>
                <div className="goal-marker">○</div>

                <div className="goal-content">
                  <p>{goal.title}</p>

                  <div className="goal-actions">
                    <form action={removeGoal.bind(null, goal.id)}>
                      <button
                        type="submit"
                        className="delete-action"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
