import Link from "next/link";
import { getProfile } from "@/app/actions/profile";
import SettingsForm from "@/components/SettingsForm";

export default async function ProfileSettingsPage() {
  const profile = await getProfile();

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

  return (
    <main className="prelude-page">
      <div className="settings-shell">
        <header className="settings-header">
          <Link href="/profile" className="back-button">
            ←
          </Link>

          <div>
            <span className="prep-kicker">PROFILE</span>
            <h1>Settings</h1>
          </div>
        </header>

        <SettingsForm profile={profile} />
      </div>
    </main>
  );
}
