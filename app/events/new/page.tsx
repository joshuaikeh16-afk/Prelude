"use client";

import { useActionState, useEffect, useState } from "react";
import { createEvent } from "@/app/actions/events";
import Link from "next/link";

type ActionState = { error?: string } | null;

async function createEventAction(
  _prevState: ActionState,
  formData: FormData
) {
  const result = await createEvent(formData);
  return result ?? null;
}

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState<
    ActionState,
    FormData
  >(createEventAction, null);

  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <main className="prelude-page">
      <div className="creation-shell">
        <header className="creation-header">
          <Link href="/dashboard" className="back-button">
            ←
          </Link>

          <div>
            <div className="eyebrow">NEW EVENT</div>
            <h1>Create something worth preparing for.</h1>
          </div>
        </header>

        <form action={formAction} className="event-form">
          <input type="hidden" name="timezone" value={timezone} />

          <section className="form-section">
            <label>
              <span>Event name</span>
              <input
                type="text"
                name="title"
                placeholder="My Birthday"
                required
                autoFocus
              />
            </label>
          </section>

          <section className="form-section">
            <div className="form-section-title">
              <span>WHEN</span>
              <small>Your event's date and time</small>
            </div>

            <div className="form-grid">
              <label>
                <span>Date</span>
                <input type="date" name="date" required />
              </label>

              <label>
                <span>Time</span>
                <input type="time" name="time" />
              </label>
            </div>
          </section>

          <section className="form-section">
            <label>
              <span>Location</span>
              <input
                type="text"
                name="location"
                placeholder="Where is it happening?"
              />
            </label>
          </section>

          <section className="form-section">
            <label>
              <span>What do you want to accomplish?</span>
              <textarea
                name="description"
                rows={4}
                placeholder="A goal or intention for this event..."
              />
              <small>
                This is an intention, not a task checklist.
              </small>
            </label>
          </section>

          <section className="form-section">
            <div className="form-section-title">
              <span>PREPARATION</span>
              <small>You can add tasks later.</small>
            </div>

            <label className="toggle-row">
              <div>
                <strong>Priority event</strong>
                <small>Keep this event visible when relevant.</small>
              </div>

              <input
                type="checkbox"
                name="is_priority"
                value="true"
              />
            </label>
          </section>

          <section className="form-section">
            <label>
              <span>Repeat</span>
              <select name="recurrence" defaultValue="never">
                <option value="never">Never</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </label>
          </section>

          <section className="form-section">
            <div className="form-section-title">
              <span>SAVINGS</span>
              <small>Optional</small>
            </div>

            <div className="form-grid">
              <label>
                <span>Goal</span>
                <input
                  type="number"
                  name="savings_goal"
                  min="0"
                  step="0.01"
                  placeholder="200000"
                />
              </label>

              <label>
                <span>Currency</span>
                <select name="currency_code" defaultValue="NGN">
                  <option value="NGN">NGN · ₦</option>
                  <option value="USD">USD · $</option>
                  <option value="GBP">GBP · £</option>
                  <option value="EUR">EUR · €</option>
                </select>
              </label>
            </div>
          </section>

          {state?.error && (
            <div className="form-error">{state.error}</div>
          )}

          <button
            type="submit"
            disabled={pending || !timezone}
            className="create-event-button"
          >
            {pending ? "Creating…" : "Create Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
