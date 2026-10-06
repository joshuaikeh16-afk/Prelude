"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKETS = ["event-images", "memory-photos", "avatars"];

// All three buckets are private, so the frontend needs signed URLs to display
// files. Only paths inside the caller's own folder are signed.
export async function getSignedMediaUrls(
  bucket: string,
  paths: string[],
  expiresInSeconds = 3600
) {
  if (!BUCKETS.includes(bucket)) return { error: "Unknown bucket." };
  if (!Array.isArray(paths)) return { error: "Paths are invalid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const owned = paths.filter((p) => typeof p === "string" && p.startsWith(`${user.id}/`)).slice(0, 100);
  if (owned.length === 0) return { urls: {} as Record<string, string> };

  const expiry = Math.min(Math.max(Math.floor(expiresInSeconds), 60), 86400);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(owned, expiry);
  if (error) return { error: error.message };

  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return { urls };
}

// Call AFTER the client has uploaded the file to
// memory-photos/{user_id}/... This only records it in the database.
// The first photo of an event becomes its cover automatically.
export async function addMemoryPhoto(eventId: string, storagePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (!storagePath.startsWith(`${user.id}/`)) {
    return { error: "Photo must be stored in your own folder." };
  }

  const { count, error: countError } = await supabase
    .from("event_memory_photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (countError) return { error: countError.message };

  const { data, error } = await supabase
    .from("event_memory_photos")
    .insert({
      event_id: eventId,
      storage_path: storagePath,
      is_cover: (count ?? 0) === 0,
    })
    .select("id, is_cover")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/profile");
  return { id: data.id as string, is_cover: data.is_cover as boolean };
}

export async function listMemoryPhotos(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_memory_photos")
    .select("id, storage_path, is_cover, created_at")
    .eq("event_id", eventId)
    .order("is_cover", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listMemoryPhotos error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function setCoverPhoto(photoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.rpc("set_cover_photo", { p_photo_id: photoId });
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true as const };
}

export async function deleteMemoryPhoto(photoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: photo, error: photoError } = await supabase
    .from("event_memory_photos")
    .select("id, event_id, storage_path, is_cover")
    .eq("id", photoId)
    .maybeSingle();
  if (photoError) return { error: photoError.message };
  if (!photo) return { error: "Photo not found." };

  const { error } = await supabase.from("event_memory_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };

  try {
    await supabase.storage.from("memory-photos").remove([photo.storage_path]);
  } catch {
    // row is gone; a leftover file is not worth failing the request
  }

  // If the cover was deleted, promote the oldest remaining photo.
  if (photo.is_cover) {
    const { data: next } = await supabase
      .from("event_memory_photos")
      .select("id")
      .eq("event_id", photo.event_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("event_memory_photos").update({ is_cover: true }).eq("id", next.id);
    }
  }

  revalidatePath(`/events/${photo.event_id}`);
  revalidatePath("/profile");
  return { ok: true as const };
}

// Recent past events that have a cover photo (current user only).
export async function getRecentMemories(limit = 10) {
  const supabase = await createClient();
  const capped = Math.min(Math.max(Math.floor(limit), 1), 50);

  const { data, error } = await supabase.from("recent_memories").select("*").limit(capped);
  if (error) {
    console.error("getRecentMemories error:", error.message);
    return [];
  }
  return data ?? [];
}
