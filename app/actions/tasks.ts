"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTask(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const dueDateRaw = String(formData.get("due_date") ?? "");

  if (!title) return;

  await supabase.from("tasks").insert({
    event_id: eventId,
    title,
    due_date: dueDateRaw || null,
  });

  revalidatePath(`/events/${eventId}`);
}

export async function toggleTask(
  taskId: string,
  completed: boolean,
  eventId: string
) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ completed }).eq("id", taskId);
  revalidatePath(`/events/${eventId}`);
}

export async function updateTask(
  taskId: string,
  eventId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const dueDateRaw = String(formData.get("due_date") ?? "");

  if (!title) return;

  await supabase
    .from("tasks")
    .update({ title, due_date: dueDateRaw || null })
    .eq("id", taskId);

  revalidatePath(`/events/${eventId}`);
}

export async function deleteTask(taskId: string, eventId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath(`/events/${eventId}`);
}

export async function getEventTasks(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, completed, due_date, created_at")
    .eq("event_id", eventId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getEventTasks error:", error.message);
    return [];
  }

  return data;
}

// Suggestions only: nothing is copied until the user picks tasks and the
// frontend calls reuseTasks(). The source is the previous occurrence (for
// recurring events) or the event this one was redone from.
export async function getReusableTaskSuggestions(eventId: string) {
  const supabase = await createClient();

  const { data: ev, error: evError } = await supabase
    .from("events")
    .select("id, source_event_id")
    .eq("id", eventId)
    .maybeSingle();
  if (evError) return { source: null, suggestions: [], error: evError.message };
  if (!ev || !ev.source_event_id) return { source: null, suggestions: [] };

  const [sourceRes, sourceTasksRes, currentTasksRes] = await Promise.all([
    supabase.from("events").select("id, title, date").eq("id", ev.source_event_id).maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, completed")
      .eq("event_id", ev.source_event_id)
      .order("created_at", { ascending: true }),
    supabase.from("tasks").select("title").eq("event_id", eventId),
  ]);

  if (!sourceRes.data) return { source: null, suggestions: [] };

  // Exact-match dedupe only (no fuzzy matching in V1).
  const existing = new Set(
    (currentTasksRes.data ?? []).map((t: { title: string }) => t.title.trim().toLowerCase())
  );
  const suggestions = (sourceTasksRes.data ?? [])
    .filter((t: { title: string }) => !existing.has(t.title.trim().toLowerCase()))
    .map((t: { id: string; title: string; completed: boolean }) => ({
      id: t.id,
      title: t.title,
      was_completed: t.completed,
    }));

  return { source: sourceRes.data, suggestions };
}

// Adds ONLY the tasks the user selected, as fresh incomplete tasks with no due date.
export async function reuseTasks(eventId: string, sourceTaskIds: string[]) {
  if (!Array.isArray(sourceTaskIds) || sourceTaskIds.length === 0) {
    return { error: "No tasks selected." };
  }

  const supabase = await createClient();

  const { data: ev, error: evError } = await supabase
    .from("events")
    .select("id, source_event_id")
    .eq("id", eventId)
    .maybeSingle();
  if (evError) return { error: evError.message };
  if (!ev || !ev.source_event_id) return { error: "No previous event to reuse tasks from." };

  // Constrain to the source event so arbitrary task ids can't be pulled in.
  const { data: sourceTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("event_id", ev.source_event_id)
    .in("id", sourceTaskIds);
  if (tasksError) return { error: tasksError.message };
  if (!sourceTasks || sourceTasks.length === 0) return { error: "Selected tasks not found." };

  const { error } = await supabase.from("tasks").insert(
    sourceTasks.map((t: { title: string }) => ({
      event_id: eventId,
      title: t.title,
      completed: false,
      due_date: null,
    }))
  );
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { added: sourceTasks.length };
}
