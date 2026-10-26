"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarRange, Plus, Calendar } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/dashboard" || pathname === "/";
  const isEvents = pathname.startsWith("/events") && pathname !== "/events/new";
  const isCalendar = pathname === "/calendar";

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[#09090c]/90 backdrop-blur-2xl"
    >
      <div className="relative mx-auto flex max-w-[620px] items-center justify-around px-4 pb-[max(env(safe-area-inset-bottom,0px),14px)] pt-2.5">
        <NavLink
          href="/dashboard"
          label="Home"
          Icon={House}
          active={isHome}
        />

        <NavLink
          href="/events"
          label="Events"
          Icon={CalendarRange}
          active={isEvents}
        />

        {/* Center Standout Accent "+" Button with gentle idle pulse */}
        <Link
          href="/events/new"
          aria-label="Create event"
          className="create-nav -mt-7 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)] transition-transform duration-200 active:scale-95 hover:scale-105"
        >
          <Plus size={26} strokeWidth={2.5} />
        </Link>

        <NavLink
          href="/calendar"
          label="Calendar"
          Icon={Calendar}
          active={isCalendar}
        />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof House;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-col items-center gap-1 px-4 py-1.5 transition-transform duration-150 active:scale-95"
    >
      {/* Sliding active indicator glow pill behind active item */}
      {active && (
        <span
          className="absolute inset-0 -z-10 rounded-2xl bg-[var(--accent-soft)]/50 border border-[var(--accent-border,rgba(255,59,100,0.25))] transition-all duration-300"
          aria-hidden="true"
        />
      )}

      <Icon
        size={22}
        strokeWidth={2}
        className="transition-colors duration-200"
        color={active ? "var(--accent)" : "var(--text-muted)"}
      />
      <span
        className="text-[11px] font-medium tracking-tight transition-colors duration-200"
        style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
      >
        {label}
      </span>
    </Link>
  );
}
