import Link from "next/link";
import { getProfile, getProfileStats } from "@/app/actions/profile";

export default async function ProfilePage() {
  const [profile, profileStats] = await Promise.all([
    getProfile(),
    getProfileStats(),
  ]);

  if (!profile) {
    return (
      <main className="prelude-page">
        <div className="profile-shell">
          <div className="profile-empty">
            <h1>Profile unavailable</h1>
            <p>Please log in to continue.</p>
            <Link href="/login">Log in</Link>
          </div>
        </div>
      </main>
    );
  }

  const name =
    profile.nickname ||
    profile.display_name ||
    "Prelude user";

  const initials = name
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const stats = profileStats?.stats;

  return (
    <main className="prelude-page">
      <div className="profile-shell">
        <header className="profile-header">
          <Link href="/dashboard" className="back-button">
            ←
          </Link>

          <span>PROFILE</span>

          <span className="profile-header-spacer" />
        </header>

        <section className="profile-identity">
          <div className="profile-avatar">
            {profile.avatar_path ? (
              <img src={profile.avatar_path} alt="" />
            ) : (
              initials
            )}
          </div>

          <h1>{name}</h1>

          {profile.email && (
            <p>{profile.email}</p>
          )}
        </section>

        <section className="profile-stats">
          <div>
            <strong>{stats?.total_events ?? 0}</strong>
            <span>EVENTS</span>
          </div>

          <div>
            <strong>{stats?.completed_events ?? 0}</strong>
            <span>COMPLETED</span>
          </div>

          <div>
            <strong>{stats?.upcoming_events ?? 0}</strong>
            <span>UPCOMING</span>
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-label">
            PREFERENCES
          </div>

          <Link
            href="/profile/settings"
            className="profile-option"
          >
            <div>
              <strong>Preferences</strong>
              <small>
                Notifications, timezone and appearance
              </small>
            </div>

            <span>›</span>
          </Link>

          <Link
            href="/profile/memories"
            className="profile-option"
          >
            <div>
              <strong>Memories</strong>
              <small>
                Revisit your past events
              </small>
            </div>

            <span>›</span>
          </Link>
        </section>

        <section className="profile-section">
          <div className="profile-section-label">
            ABOUT
          </div>

          <div className="profile-info-row">
            <span>Timezone</span>
            <strong>
              {profile.timezone || "Not set"}
            </strong>
          </div>

          <div className="profile-info-row">
            <span>Reminder horizon</span>
            <strong>
              {profile.reminder_horizon.replace("_", " ")}
            </strong>
          </div>

          <div className="profile-info-row">
            <span>Notifications</span>
            <strong>
              {profile.notifications_enabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>
        </section>
      </div>

      <nav className="bottom-nav">
        <Link href="/dashboard">Home</Link>
        <Link href="/events">Events</Link>
        <Link href="/events/new" className="create-nav">
          +
        </Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/profile" className="active">
          Profile
        </Link>
      </nav>
    </main>
  );
}
