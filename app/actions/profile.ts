"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const HORIZONS = ["7_days", "1_month", "3_months", "6_months", "1_year"];
const ACCENTS = ["red", "purple", "blue", "green", "orange"];

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, nickname, avatar_path, reminder_horizon, notifications_enabled, timezone, accent_color"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error.message);
    return null;
  }
  if (!data) return null;

  return { ...data, email: user.email ?? null };
}

// Partial update: only fields present in the FormData are changed.
// Booleans must be sent explicitly as "true" / "false".
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const update: Record<string, string | boolean | null> = {};

  if (formData.has("nickname")) {
    const nickname = String(formData.get("nickname") ?? "").trim();
    if (nickname.length > 40) return { error: "Nickname is too long (max 40 characters)." };
    update.nickname = nickname === "" ? null : nickname;
  }

  if (formData.has("avatar_path")) {
    const avatar = String(formData.get("avatar_path") ?? "").trim();
    if (avatar !== "" && !avatar.startsWith(`${user.id}/`)) {
      return { error: "Avatar must be stored in your own folder." };
    }
    update.avatar_path = avatar === "" ? null : avatar;
  }

  if (formData.has("reminder_horizon")) {
    const horizon = String(formData.get("reminder_horizon") ?? "");
    if (!HORIZONS.includes(horizon)) return { error: "Reminder horizon is invalid." };
    update.reminder_horizon = horizon;
  }

  if (formData.has("accent_color")) {
    const accent = String(formData.get("accent_color") ?? "");
    if (!ACCENTS.includes(accent)) return { error: "Accent color is invalid." };
    update.accent_color = accent;
  }

  if (formData.has("notifications_enabled")) {
    const raw = String(formData.get("notifications_enabled") ?? "");
    update.notifications_enabled = raw === "true" || raw === "on";
  }

  if (formData.has("timezone")) {
    const tz = String(formData.get("timezone") ?? "").trim();
    if (tz !== "" && !isValidTimezone(tz)) return { error: "Timezone is invalid." };
    update.timezone = tz === "" ? null : tz;
  }

  if (Object.keys(update).length === 0) return { error: "Nothing to update." };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

// Derived from existing tables via views: no stored counters to drift.
// Savings are grouped by currency because summing mixed currencies is meaningless.
export async function getProfileStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [statsRes, savingsRes] = await Promise.all([
    supabase.from("profile_stats").select("*").maybeSingle(),
    supabase.from("profile_savings_by_currency").select("*"),
  ]);

  if (statsRes.error) {
    console.error("getProfileStats error:", statsRes.error.message);
    return null;
  }

  return {
    stats: statsRes.data,
    savings_by_currency: savingsRes.data ?? [],
  };
}
