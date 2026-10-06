"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { rankEligibleEvents, type HomeEvent } from "@/lib/home-ranking";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Recurrence = "never" | "weekly" | "monthly" | "yearly";

const RECURRENCES: Recurrence[] = ["never", "weekly", "monthly", "yearly"];
const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

const EVENT_LIST_FIELDS =
  "id, title, date, time, timezone, location, image_path, is_priority, savings_goal, saved_amount, currency_code, status, series_id";

const EVENT_DETAIL_FIELDS =
  "id, title, description, date, time, timezone, location, image_path, is_priority, savings_goal, saved_amount, currency_code, status, series_id, source_event_id, created_at, event_series(recurrence, recurrence_active)";

type ParsedEvent = {
  title?: string;
  date?: string;
  time?: string | null;
  timezone?: string;
  location?: string | null;
  description?: string | null;
  image_path?: string | null;
  is_priority?: boolean;
  savings_goal?: string | null;
  currency_code?: string;
  recurrence?: Recurrence;
};

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// undefined = field not submitted (leave unchanged), null = submitted empty (clear it)
function optText(fd: FormData, key: string): string | null | undefined {
  if (!fd.has(key)) return undefined;
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function parseEventForm(
  fd: FormData,
  userId: string
): { value: ParsedEvent } | { error: string } {
  const value: ParsedEvent = {};

  if (fd.has("title")) {
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return { error: "Title is required." };
    if (title.length > 120) return { error: "Title is too long (max 120 characters)." };
    value.title = title;
  }

  if (fd.has("date")) {
    const date = String(fd.get("date") ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Date is invalid." };
    value.date = date;
  }

  const time = optText(fd, "time");
  if (time !== undefined) {
    if (time !== null && !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      return { error: "Time is invalid." };
    }
    value.time = time;
  }

  if (fd.has("timezone")) {
    const timezone = String(fd.get("timezone") ?? "").trim();
    if (!timezone || !isValidTimezone(timezone)) return { error: "Timezone is invalid." };
    value.timezone = timezone;
  }

  const location = optText(fd, "location");
  if (location !== undefined) value.location = location;

  const description = optText(fd, "description");
  if (description !== undefined) value.description = description;

  const imagePath = optText(fd, "image_path");
  if (imagePath !== undefined) {
    if (imagePath !== null && !imagePath.startsWith(`${userId}/`)) {
      return { error: "Image must be stored in your own folder." };
    }
    value.image_path = imagePath;
  }

  if (fd.has("is_priority")) {
    const raw = String(fd.get("is_priority") ?? "");
    value.is_priority = raw === "true" || raw === "on";
  }

  const savingsGoal = optText(fd, "savings_goal");
  if (savingsGoal !== undefined) {
    if (savingsGoal !== null) {
      if (!MONEY_PATTERN.test(savingsGoal) || Number(savingsGoal) <= 0) {
        return { error: "Savings goal must be a positive amount with at most 2 decimals." };
      }
    }
    value.savings_goal = savingsGoal;
  }

  if (fd.has("currency_code")) {
    const code = String(fd.get("currency_code") ?? "").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) return { error: "Currency code must be 3 letters." };
    value.currency_code = code;
  }

  if (fd.has("recurrence")) {
    const raw = String(fd.get("recurrence") ?? "");
    if (!RECURRENCES.includes(raw as Recurrence)) return { error: "Recurrence is invalid." };
    value.recurrence = raw as Recurrence;
  }

  return { value };
}

function normalizeEvent(row: any) {
  if (!row) return null;
  const series = Array.isArray(row.event_series) ? row.event_series[0] : row.event_series;
  const { event_series: _ignored, ...rest } = row;
  const recurrence: Recurrence =
    series && series.recurrence_active ? (series.recurrence as Recurrence) : "never";
  return { ...rest, recurrence };
}

async function applyRecurrence(
  supabase: Supabase,
  userId: string,
  eventId: string,
  seriesId: string | null,
  recurrence: Recurrence,
  anchorDate: string
): Promise<string | null> {
  if (recurrence === "never") {
    if (seriesId) {
      const { error } = await supabase
        .from("event_series")
        .update({ recurrence_active: false })
        .eq("id", seriesId);
      if (error) return error.message;
    }
    return null;
  }

  if (seriesId) {
    const { error } = await supabase
      .from("event_series")
      .update({ recurrence, recurrence_active: true })
      .eq("id", seriesId);
    return error ? error.message : null;
  }

  const { data: series, error: seriesError } = await supabase
    .from("event_series")
    .insert({ user_id: userId, recurrence, anchor_date: anchorDate })
    .select("id")
    .single();
  if (seriesError) return seriesError.message;

  const { error: linkError } = await supabase
    .from("events")
    .update({ series_id: series.id })
    .eq("id", eventId);
  return linkError ? linkError.message : null;
}

function revalidateEventViews(eventId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/calendar");
  revalidatePath("/profile");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to create an event." };

  const parsed = parseEventForm(formData, user.id);
  if ("error" in parsed) return { error: parsed.error };
  const f = parsed.value;

  if (!f.title) return { error: "Title is required." };
  if (!f.date) return { error: "Date is required." };
  if (!f.timezone) return { error: "Timezone is required." };

  const recurrence = f.recurrence ?? "never";
  let seriesId: string | null = null;

  if (recurrence !== "never") {
    const { data: series, error: seriesError } = await supabase
      .from("event_series")
      .insert({ user_id: user.id, recurrence, anchor_date: f.date })
      .select("id")
      .single();
    if (seriesError) return { error: seriesError.message };
    seriesId = series.id;
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: f.title,
      date: f.date,
      time: f.time ?? null, // null = midnight in the event's timezone
      timezone: f.timezone,
      location: f.location ?? null,
      description: f.description ?? null,
      image_path: f.image_path ?? null,
      is_priority: f.is_priority ?? false,
      savings_goal: f.savings_goal ?? null,
      currency_code: f.currency_code ?? "NGN",
      series_id: seriesId,
    })
    .select("id")
    .single();

  if (error) {
    if (seriesId) await supabase.from("event_series").delete().eq("id", seriesId);
    return { error: error.message };
  }

  revalidateEventViews();
  redirect(`/events/${data.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to edit an event." };

  const parsed = parseEventForm(formData, user.id);
  if ("error" in parsed) return { error: parsed.error };
  const { recurrence, ...fields } = parsed.value;

  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select("id, date, series_id")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Event not found." };

  if (Object.keys(fields).length > 0) {
    const { error } = await supabase.from("events").update(fields).eq("id", id);
    if (error) return { error: error.message };
  }

  if (recurrence !== undefined) {
    const recurrenceError = await applyRecurrence(
      supabase,
      user.id,
      id,
      existing.series_id,
      recurrence,
      fields.date ?? existing.date
    );
    if (recurrenceError) return { error: recurrenceError };
  }

  revalidateEventViews(id);
  redirect(`/events/${id}`);
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Collect file paths first: the rows cascade away with the event.
  const { data: ev } = await supabase
    .from("events")
    .select("id, image_path")
    .eq("id", id)
    .maybeSingle();
  const { data: photos } = await supabase
    .from("event_memory_photos")
    .select("storage_path")
    .eq("event_id", id);

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  // Best-effort cleanup so private files don't linger orphaned.
  try {
    if (ev?.image_path) await supabase.storage.from("event-images").remove([ev.image_path]);
    const photoPaths = (photos ?? []).map((p: { storage_path: string }) => p.storage_path);
    if (photoPaths.length > 0) await supabase.storage.from("memory-photos").remove(photoPaths);
  } catch {
    // the event is already gone; a leftover file is not worth failing the request
  }

  revalidateEventViews();
  redirect("/dashboard");
}

export async function getEventById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEventById error:", error.message);
    return null;
  }
  return normalizeEvent(data);
}

export async function getUserEvents(status?: "upcoming" | "past") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase.from("events").select(EVENT_LIST_FIELDS).eq("user_id", user.id);
  if (status) query = query.eq("status", status);

  const { data, error } = await query
    .order("date", { ascending: status !== "past" })
    .order("time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("getUserEvents error:", error.message);
    return [];
  }
  return data ?? [];
}

// Calendar: `date` is already the event's LOCAL calendar date (in its own
// timezone), so a plain date-range query places every event on the right day.
export async function getEventsInRange(from: string, to: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_FIELDS)
    .eq("user_id", user.id)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("getEventsInRange error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function completeEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.rpc("complete_event", { p_event_id: eventId });
  if (error) return { error: error.message };

  revalidateEventViews(eventId);
  return { ok: true as const };
}

export async function stopRepeating(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: ev, error: evError } = await supabase
    .from("events")
    .select("id, series_id")
    .eq("id", eventId)
    .maybeSingle();
  if (evError) return { error: evError.message };
  if (!ev) return { error: "Event not found." };
  if (!ev.series_id) return { error: "This event doesn't repeat." };

  // Only the series flag changes: past occurrences and their data stay untouched.
  const { error } = await supabase
    .from("event_series")
    .update({ recurrence_active: false })
    .eq("id", ev.series_id);
  if (error) return { error: error.message };

  revalidateEventViews(eventId);
  return { ok: true as const };
}

export async function updateSavedAmount(eventId: string, amount: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const cleaned = String(amount).trim();
  if (!MONEY_PATTERN.test(cleaned)) {
    return { error: "Amount must be a number with at most 2 decimals." };
  }

  const { data: ev, error: evError } = await supabase
    .from("events")
    .select("id, savings_goal")
    .eq("id", eventId)
    .maybeSingle();
  if (evError) return { error: evError.message };
  if (!ev) return { error: "Event not found." };
  if (ev.savings_goal === null) return { error: "This event has no savings goal." };

  const { error } = await supabase
    .from("events")
    .update({ saved_amount: cleaned })
    .eq("id", eventId);
  if (error) return { error: error.message };

  revalidateEventViews(eventId);
  return { ok: true as const };
}

// Redo: creates a NEW one-time event from a past one. The old event is never
// modified. Carries title, location, description, time, original timezone and
// savings goal/currency. Resets image, saved amount (0), priority (false).
export async function redoEvent(sourceEventId: string, newDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return { error: "Date is invalid." };

  const { data: source, error: sourceError } = await supabase
    .from("events")
    .select("id, title, description, time, timezone, location, savings_goal, currency_code, status")
    .eq("id", sourceEventId)
    .maybeSingle();
  if (sourceError) return { error: sourceError.message };
  if (!source) return { error: "Event not found." };
  if (source.status !== "past") return { error: "Only past events can be redone." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: source.title,
      description: source.description,
      date: newDate,
      time: source.time,
      timezone: source.timezone,
      location: source.location,
      savings_goal: source.savings_goal,
      currency_code: source.currency_code,
      saved_amount: 0,
      is_priority: false,
      image_path: null,
      series_id: null,
      source_event_id: source.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidateEventViews();
  redirect(`/events/${data.id}`);
}

// Home: the database view applies the reminder-horizon gate; ranking is the
// swappable placeholder in lib/home-ranking.ts.
export async function getHomeEvents(): Promise<{
  hero: HomeEvent | null;
  secondary: HomeEvent[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hero: null, secondary: [], error: "Not logged in." };

  const { data, error } = await supabase.from("home_eligible_events").select("*");
  if (error) return { hero: null, secondary: [], error: error.message };

  return rankEligibleEvents((data ?? []) as HomeEvent[]);
}
