import Link from "next/link";
import { Bell, UserRound } from "lucide-react";

export function TopBar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-6">
      <div>
        <div className="eyebrow">Prelude</div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Prepare for what&rsquo;s next.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full border border-[var(--line)] bg-white/[0.04] p-2.5"
        >
          <Bell size={17} />
        </button>
        <Link
          href="/profile"
          aria-label="Profile"
          className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)]"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={18} />
          )}
        </Link>
      </div>
    </header>
  );
}
