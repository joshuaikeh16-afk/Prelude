"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarRange, Plus, Calendar } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/events", label: "Events", Icon: CalendarRange },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[#09090a]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[620px] items-center justify-between px-6 pb-[max(env(safe-area-inset-bottom,0px),14px)] pt-3">
        <NavLink
          href={items[0].href}
          label={items[0].label}
          Icon={items[0].Icon}
          active={pathname === items[0].href}
        />
        <NavLink
          href={items[1].href}
          label={items[1].label}
          Icon={items[1].Icon}
          active={pathname === items[1].href}
        />

        <Link
          href="/events/new"
          aria-label="Create event"
          className="press-on-tap -mt-7 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/30"
        >
          <Plus size={26} />
        </Link>

        <NavLink
          href="/calendar"
          label="Calendar"
          Icon={Calendar}
          active={pathname === "/calendar"}
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
    <Link href={href} className="flex flex-col items-center gap-1 px-3 py-1">
      <Icon
        size={22}
        strokeWidth={active ? 2.25 : 1.75}
        color={active ? "var(--accent)" : "var(--text-muted)"}
      />
      <span
        className="text-[10px] font-medium"
        style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
      >
        {label}
      </span>
    </Link>
  );
}
