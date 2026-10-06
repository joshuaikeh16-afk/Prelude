export type HomeEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  timezone: string;
  location: string | null;
  image_path: string | null;
  is_priority: boolean;
  savings_goal: number | null;
  saved_amount: number;
  currency_code: string;
  series_id: string | null;
  start_at: string;
  tasks_total: number;
  tasks_completed: number;
};

/**
 * PLACEHOLDER ranking (not finalized): priority events first, then soonest.
 * Every event passed in has ALREADY cleared the user's reminder horizon in the
 * database view, so priority can only reorder eligible events, never admit
 * events from outside the horizon.
 *
 * When the readiness algorithm is decided (progress, savings vs. time left),
 * change only this function. Callers keep getting { hero, secondary }.
 */
export function rankEligibleEvents(events: HomeEvent[]): {
  hero: HomeEvent | null;
  secondary: HomeEvent[];
} {
  const sorted = [...events].sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  });

  const [hero = null, ...secondary] = sorted;
  return { hero, secondary };
}
