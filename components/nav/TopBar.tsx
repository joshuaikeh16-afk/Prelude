import Link from "next/link";
import Image from "next/image";
import { Bell, UserRound } from "lucide-react";

export function TopBar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <header className="flex items-center justify-between pb-5 pt-2">
      <Link href="/dashboard" aria-label="Rixie home" className="group flex items-center gap-2.5">
        <Image src="/rixie-app-icon.png" alt="" width={38} height={38} priority className="rounded-xl shadow-[0_5px_18px_rgba(139,109,224,0.22)] transition-transform group-hover:scale-[1.03]" />
        <div className="flex flex-col">
          <span className="font-semibold tracking-[0.12em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">RIXIE</span>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Prepare for what&rsquo;s next.
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-glass)] text-[var(--text-secondary)] backdrop-blur-md transition-all duration-200 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <Bell size={17} strokeWidth={1.8} />
        </button>

        <Link
          href="/profile"
          aria-label="Profile"
          className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-gradient-to-br from-[#1d1d24] to-[#121215] text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_0_12px_var(--accent-glow)] active:scale-95"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound
              size={18}
              strokeWidth={1.8}
              className="text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]"
            />
          )}
        </Link>
      </div>
    </header>
  );
}
