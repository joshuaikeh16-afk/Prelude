"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { accentList, AccentColor, accentHex } from "@/components/ui/tokens";
import { Check, Palette, Bell, Clock, User, Sparkles } from "lucide-react";

type Profile = {
  nickname: string | null;
  reminder_horizon: string;
  notifications_enabled: boolean;
  timezone: string | null;
  accent_color: string;
};

export default function SettingsForm({
  profile,
}: {
  profile: Profile;
}) {
  const [message, setMessage] = useState("");
  const [selectedAccent, setSelectedAccent] = useState<AccentColor>(
    (profile.accent_color as AccentColor) || "purple"
  );

  function handleAccentChange(colorKey: AccentColor) {
    setSelectedAccent(colorKey);
    const hex = accentHex(colorKey);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--accent", hex);
    }
  }

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await updateProfile(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Changes saved successfully.");
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Hidden input to pass selected accent to server action */}
      <input type="hidden" name="accent_color" value={selectedAccent} />

      {/* Personal Section */}
      <section className="settings-section rise-1">
        <div className="profile-section-label flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-2">
          <User size={13} className="text-[var(--accent)]" />
          <span>PERSONAL</span>
        </div>

        <div className="settings-card p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Preferred name</span>
            <input
              name="nickname"
              defaultValue={profile.nickname ?? ""}
              maxLength={40}
              placeholder="What should Rixie call you?"
              className="rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </section>

      {/* Appearance / Curated Accent Palette */}
      <section className="settings-section rise-2">
        <div className="profile-section-label flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-2">
          <Palette size={13} className="text-[var(--accent)]" />
          <span>APPEARANCE & ACCENT</span>
        </div>

        <div className="settings-card p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)]">
          <div>
            <span className="text-xs font-medium text-[var(--text-secondary)] block">
              Curated Accent Color
            </span>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Drives all glows, buttons, highlights and countdown accents.
            </p>

            <div className="accent-palette-picker mt-3.5 flex items-center gap-3">
              {accentList.map(({ id, name, hex }) => {
                const isSelected = selectedAccent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleAccentChange(id)}
                    aria-label={`Select ${name} accent`}
                    style={{ backgroundColor: hex }}
                    className={`relative grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-95 ${
                      isSelected
                        ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#080809] shadow-lg"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {isSelected && (
                      <Check size={16} strokeWidth={3} className="text-white drop-shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Reminders & Horizon */}
      <section className="settings-section rise-3">
        <div className="profile-section-label flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-2">
          <Clock size={13} className="text-[var(--accent)]" />
          <span>REMINDERS & TIMEZONE</span>
        </div>

        <div className="settings-card p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] space-y-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Reminder horizon</span>
            <select
              name="reminder_horizon"
              defaultValue={profile.reminder_horizon}
              className="rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="7_days">7 days</option>
              <option value="1_month">1 month</option>
              <option value="3_months">3 months</option>
              <option value="6_months">6 months</option>
              <option value="1_year">1 year</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Timezone</span>
            <input
              name="timezone"
              defaultValue={profile.timezone ?? ""}
              placeholder="e.g. Africa/Lagos or UTC"
              className="rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </section>

      {/* Notifications Switch */}
      <section className="settings-section rise-4">
        <div className="profile-section-label flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-2">
          <Bell size={13} className="text-[var(--accent)]" />
          <span>NOTIFICATIONS</span>
        </div>

        <div className="settings-card p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)]">
          <label className="toggle-row flex items-center justify-between cursor-pointer">
            <div>
              <strong className="text-sm font-semibold text-[var(--text-primary)]">
                Event & Task Reminders
              </strong>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Receive notifications when preparation deadlines approach.
              </p>
            </div>

            <input
              type="checkbox"
              name="notifications_enabled"
              value="true"
              defaultChecked={profile.notifications_enabled}
              className="h-5 w-5 accent-[var(--accent)] rounded"
            />
          </label>
        </div>
      </section>

      {/* Status Feedback Message */}
      {message && (
        <div className="p-3 rounded-2xl border border-[var(--accent-border,rgba(255,59,100,0.3))] bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-primary)] text-center animate-fade">
          {message}
        </div>
      )}

      {/* Save Button */}
      <button
        type="submit"
        className="w-full rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-98"
      >
        Save changes
      </button>
    </form>
  );
}
