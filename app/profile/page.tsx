import Link from "next/link";
import { getProfile, getProfileStats } from "@/app/actions/profile";
import { getUserEvents } from "@/app/actions/events";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Lock,
  Settings,
  Sparkles,
  UserCheck,
} from "lucide-react";

export default async function ProfilePage() {
  const [profile, profileStats, userEvents] = await Promise.all([
    getProfile(),
    getProfileStats(),
    getUserEvents().catch(() => []),
  ]);

  if (!profile) {
    return (
      <main className="prelude-page">
        <div className="profile-shell">
          <div className="empty-state rise">
            <h1 className="text-xl font-bold">Profile unavailable</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Please log in to view your profile and memories.
            </p>
            <div className="mt-4">
              <Link href="/login" className="primary-button">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const name =
    profile.nickname ||
    profile.display_name ||
    "Rixie user";

  const initials = name
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const stats = profileStats?.stats;
  const memories = userEvents.filter((e) => e.status === "past");

  return (
    <main className="prelude-page">
      <div className="profile-shell">
        <header className="profile-header rise">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <span className="eyebrow flex items-center gap-1.5">
            <Sparkles size={11} className="text-[var(--accent)]" />
            <span>PROFILE</span>
          </span>

          <span className="w-10" />
        </header>

        {/* Profile Identity Card */}
        <section className="profile-identity rise-1">
          <div className="profile-avatar">
            {profile.avatar_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_path} alt="" />
            ) : (
              initials
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {name}
          </h1>

          {profile.email && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {profile.email}
            </p>
          )}
        </section>

        {/* Derived Stats in Glass Tiles */}
        <section className="profile-stats rise-2">
          <div className="glass p-4 text-center">
            <strong className="text-2xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
              {stats?.total_events ?? 0}
            </strong>
            <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mt-1 block">
              TOTAL EVENTS
            </span>
          </div>

          <div className="glass p-4 text-center">
            <strong className="text-2xl font-bold text-[var(--success)] font-mono tabular-nums">
              {stats?.completed_events ?? 0}
            </strong>
            <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mt-1 block">
              REMEMBERED
            </span>
          </div>

          <div className="glass p-4 text-center">
            <strong className="text-2xl font-bold text-[var(--accent)] font-mono tabular-nums">
              {stats?.upcoming_events ?? 0}
            </strong>
            <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mt-1 block">
              UPCOMING
            </span>
          </div>
        </section>

        {/* Your Memories Row with Cover Photos */}
        <section className="profile-section rise-3 mb-6">
          <div className="profile-section-label flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider text-[var(--accent)] uppercase">
              YOUR MEMORIES
            </span>
            <small className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
              {memories.length} {memories.length === 1 ? "moment" : "moments"}
            </small>
          </div>

          {memories.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-5 text-center">
              <Sparkles size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-secondary)]">
                Completed events will appear here with their cover photos and reflections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {memories.slice(0, 4).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-3 transition hover:border-[var(--line-strong)] hover:shadow-lg"
                >
                  <div className="relative h-24 w-full overflow-hidden rounded-xl bg-[#181820] mb-2">
                    {event.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_path}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#262630] to-[#121216]" />
                    )}
                  </div>
                  <strong className="text-xs font-semibold text-[var(--text-primary)] block truncate group-hover:text-white">
                    {event.title}
                  </strong>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                    {new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Preferences & Settings */}
        <section className="profile-section rise-4 mb-6">
          <div className="profile-section-label text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-3">
            ACCOUNT & PREFERENCES
          </div>

          <Link
            href="/profile/settings"
            className="profile-option group flex items-center justify-between p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] transition hover:border-[var(--line-strong)]"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-[var(--accent)]">
                <Settings size={18} strokeWidth={2} />
              </div>
              <div>
                <strong className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white">
                  Preferences
                </strong>
                <p className="text-xs text-[var(--text-secondary)]">
                  Accent color, notifications and timezone
                </p>
              </div>
            </div>

            <ChevronRight
              size={18}
              className="text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]"
            />
          </Link>
        </section>

        {/* Derived Account Details */}
        <section className="profile-section rise-5">
          <div className="profile-section-label text-xs font-bold tracking-wider text-[var(--accent)] uppercase mb-3">
            CONFIGURATION
          </div>

          <div className="flex flex-col gap-2">
            <div className="profile-info-row flex items-center justify-between p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] text-xs">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--accent)]" />
                Timezone
              </span>
              <strong className="text-[var(--text-primary)]">
                {profile.timezone || "Not set"}
              </strong>
            </div>

            <div className="profile-info-row flex items-center justify-between p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] text-xs">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Calendar size={13} className="text-[var(--accent)]" />
                Reminder horizon
              </span>
              <strong className="text-[var(--text-primary)]">
                {profile.reminder_horizon.replace("_", " ")}
              </strong>
            </div>

            <div className="profile-info-row flex items-center justify-between p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] text-xs">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <UserCheck size={13} className="text-[var(--accent)]" />
                Notifications
              </span>
              <strong
                className={
                  profile.notifications_enabled
                    ? "text-[var(--success)] font-semibold"
                    : "text-[var(--text-muted)]"
                }
              >
                {profile.notifications_enabled ? "Enabled" : "Disabled"}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
