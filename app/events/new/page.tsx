"use client";

import { useActionState, useState } from "react";
import { createEvent } from "@/app/actions/events";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  Compass,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";

type ActionState = { error?: string } | null;

async function createEventAction(
  _prevState: ActionState,
  formData: FormData
) {
  const result = await createEvent(formData);
  return result ?? null;
}

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createEventAction,
    null
  );

  const [dateValue, setDateValue] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [timezone] = useState(() =>
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC"
  );

  function setShortcutDate(daysToAdd: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setDateValue(formatDateISO(d));
  }

  function setThisFriday() {
    const d = new Date();
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    setDateValue(formatDateISO(d));
  }

  function handleCurrentLocation() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationValue("Current Location");
        },
        () => {
          setLocationValue("Nearby");
        }
      );
    }
  }

  return (
    <main className="prelude-page">
      <div className="creation-shell">
        <header className="creation-header rise">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--accent)]" />
              <span>NEW EVENT</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Create a moment.
            </h1>
          </div>
        </header>

        <form action={formAction} className="event-form space-y-4">
          <input type="hidden" name="timezone" value={timezone} />

          {/* Core required fields: Title and Date FIRST */}
          <section className="form-section rise-1">
            <label>
              <span>Event name</span>
              <input
                type="text"
                name="title"
                placeholder="What are you preparing for?"
                required
                autoFocus
              />
            </label>

            <div className="mt-4">
              <label>
                <span>Date</span>
                <input
                  type="date"
                  name="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  required
                />
              </label>

              {/* Natural Date Shortcuts Row */}
              <div className="date-shortcuts-row">
                <button
                  type="button"
                  onClick={() => setShortcutDate(1)}
                  className="date-pill"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={setThisFriday}
                  className="date-pill"
                >
                  This Friday
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutDate(14)}
                  className="date-pill"
                >
                  In 2 weeks
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutDate(30)}
                  className="date-pill"
                >
                  In 1 month
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label>
                <span>Start time (optional)</span>
                <div className="relative">
                  <input type="time" name="time" />
                  <Clock
                    size={15}
                    className="pointer-events-none absolute right-3 top-3.5 text-[var(--text-muted)]"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Optional sections: Collapsed in elegant disclosures */}
          <details className="group form-section rise-2">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] select-none">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <MapPin size={16} className="text-[var(--accent)]" />
                Location & Venue
              </span>
              <span className="text-xs text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-3">
              <label>
                <span>Location</span>
                <input
                  type="text"
                  name="location"
                  placeholder="Venue, city or place"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={handleCurrentLocation}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-white"
              >
                <Compass size={13} className="text-[var(--accent)]" />
                Use my current location
              </button>
            </div>
          </details>

          <details className="group form-section rise-3">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] select-none">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={16} className="text-[var(--accent)]" />
                Intention & Accomplishment
              </span>
              <span className="text-xs text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="mt-4 pt-3 border-t border-[var(--line)]">
              <label>
                <span>What do you want to accomplish?</span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Set your intention for this event..."
                />
                <small className="text-xs text-[var(--text-muted)] mt-1">
                  This is your personal vision, not a task checklist.
                </small>
              </label>
            </div>
          </details>

          <details className="group form-section rise-4">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] select-none">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Calendar size={16} className="text-[var(--accent)]" />
                Priority & Recurrence
              </span>
              <span className="text-xs text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-4">
              <label className="toggle-row">
                <div>
                  <strong className="text-sm font-semibold text-[var(--text-primary)]">
                    Priority event
                  </strong>
                  <p className="text-xs text-[var(--text-muted)]">
                    Keeps this event prominent on your home view.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="is_priority"
                  value="true"
                  className="h-5 w-5 accent-[var(--accent)] rounded"
                />
              </label>

              <label>
                <span>Repeat</span>
                <select name="recurrence" defaultValue="never">
                  <option value="never">Never</option>
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                  <option value="yearly">Every year</option>
                </select>
              </label>
            </div>
          </details>

          <details className="group form-section rise-5">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text-primary)] select-none">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Coins size={16} className="text-[var(--accent)]" />
                Savings Goal (Optional)
              </span>
              <span className="text-xs text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="mt-4 pt-3 border-t border-[var(--line)]">
              <div className="form-grid">
                <label>
                  <span>Savings Target</span>
                  <input
                    type="number"
                    name="savings_goal"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 50000"
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
            </div>
          </details>

          {state?.error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-400">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !timezone}
            className="create-event-button press-on-tap"
          >
            {pending ? "Creating your moment…" : "Create Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
