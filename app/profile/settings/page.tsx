import Link from "next/link";
import { getProfile } from "@/app/actions/profile";
import SettingsForm from "@/components/SettingsForm";
import { ArrowLeft, Sparkles } from "lucide-react";

export default async function ProfileSettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <main className="prelude-page">
        <div className="profile-shell">
          <div className="empty-state rise">
            <h1 className="text-xl font-bold">Profile unavailable</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Please log in to continue.
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

  return (
    <main className="prelude-page">
      <div className="settings-shell">
        <header className="settings-header rise">
          <Link
            href="/profile"
            aria-label="Back to profile"
            className="back-button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--accent)]" />
              <span>PROFILE</span>
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Preferences
            </h1>
          </div>

          <span className="w-10" />
        </header>

        <SettingsForm profile={profile} />
      </div>
    </main>
  );
}
