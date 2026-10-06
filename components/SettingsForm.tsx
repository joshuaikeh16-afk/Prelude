"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";

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

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await updateProfile(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Changes saved.");
  }

  return (
    <form action={handleSubmit}>
      <section className="settings-section">
        <div className="profile-section-label">
          PERSONAL
        </div>

        <div className="settings-card">
          <label>
            <span>Nickname</span>
            <input
              name="nickname"
              defaultValue={profile.nickname ?? ""}
              maxLength={40}
              placeholder="What should Prelude call you?"
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <div className="profile-section-label">
          REMINDERS
        </div>

        <div className="settings-card">
          <label>
            <span>Reminder horizon</span>

            <select
              name="reminder_horizon"
              defaultValue={profile.reminder_horizon}
            >
              <option value="7_days">7 days</option>
              <option value="1_month">1 month</option>
              <option value="3_months">3 months</option>
              <option value="6_months">6 months</option>
              <option value="1_year">1 year</option>
            </select>
          </label>

          <label>
            <span>Timezone</span>

            <input
              name="timezone"
              defaultValue={profile.timezone ?? ""}
              placeholder="Africa/Lagos"
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <div className="profile-section-label">
          APPEARANCE
        </div>

        <div className="settings-card">
          <label>
            <span>Accent</span>

            <select
              name="accent_color"
              defaultValue={profile.accent_color}
            >
              <option value="red">Red</option>
              <option value="purple">Purple</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="orange">Orange</option>
            </select>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <div className="profile-section-label">
          NOTIFICATIONS
        </div>

        <div className="settings-card">
          <label className="toggle-row">
            <div>
              <strong>Notifications</strong>
              <small>
                Allow Prelude to send reminders
              </small>
            </div>

            <input
              type="checkbox"
              name="notifications_enabled"
              value="true"
              defaultChecked={profile.notifications_enabled}
            />
          </label>
        </div>
      </section>

      {message && (
        <p className="settings-message">{message}</p>
      )}

      <button type="submit" className="settings-save">
        Save changes
      </button>
    </form>
  );
}
