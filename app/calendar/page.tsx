import Link from "next/link";
import Image from "next/image";
import { getEventsInRange } from "@/app/actions/events";
import { BottomNav } from "@/components/nav/BottomNav";
import { Calendar as CalendarIcon, ChevronRight, MapPin, Plus } from "lucide-react";

export default async function CalendarPage() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const events = await getEventsInRange(
    start.toISOString(),
    end.toISOString()
  );

  const daysInMonth = end.getDate();
  const firstDay = start.getDay();

  const eventDates = new Set(
    events.map((event) => event.date)
  );

  const monthName = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="prelude-page">
      <div className="calendar-shell">
        <header className="calendar-header rise">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Image src="/rixie-app-icon.png" alt="" width={28} height={28} className="rounded-[9px]" />
              <span>RIXIE</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Calendar
            </h1>
          </div>

          <Link
            href="/events/new"
            aria-label="Create event"
            className="events-add grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-glow)] transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>
        </header>

        {/* Elegant Calendar Month Card */}
        <section className="calendar-card rise-1">
          <div className="calendar-month-title flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {monthName}
            </h2>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {daysInMonth} days
            </span>
          </div>

          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <span key={day}>{day}</span>
              )
            )}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div
                className="calendar-day empty"
                key={`empty-${index}`}
              />
            ))}

            {Array.from(
              { length: daysInMonth },
              (_, index) => index + 1
            ).map((day) => {
              const dateKey = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(day).padStart(2, "0"),
              ].join("-");

              const hasEvent = eventDates.has(dateKey);
              const isToday = day === now.getDate();

              return (
                <Link
                  href={`/events/new?date=${dateKey}`}
                  className={`calendar-day group relative ${
                    isToday ? "today" : ""
                  }`}
                  key={day}
                  aria-label={`Day ${day}${hasEvent ? " (has event)" : ""}`}
                >
                  <span className="transition-transform group-hover:scale-110">
                    {day}
                  </span>

                  {hasEvent && (
                    <span
                      className="calendar-dot"
                      aria-label="Event indicator"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Events This Month */}
        <section className="calendar-events rise-2">
          <div className="events-section-header">
            <span>THIS MONTH</span>
            <small>{events.length}</small>
          </div>

          {events.length === 0 ? (
            <div className="events-empty">
              <strong className="text-sm text-[var(--text-primary)]">No events this month</strong>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Tap any calendar day above to quickly plan something.
              </p>
            </div>
          ) : (
            <div className="event-list">
              {events.map((event) => (
                <Link
                  href={`/events/${event.id}`}
                  className="event-list-card group"
                  key={event.id}
                >
                  <div className="event-list-image relative">
                    {event.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_path}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#24242e] to-[#141418]" />
                    )}
                  </div>

                  <div className="event-list-info">
                    <div className="event-list-top">
                      <span className="flex items-center gap-1 font-medium">
                        <CalendarIcon size={11} strokeWidth={2} />
                        {new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {event.is_priority && (
                        <b className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[var(--accent)] uppercase">
                          PRIORITY
                        </b>
                      )}
                    </div>

                    <h2 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white">
                      {event.title}
                    </h2>

                    {event.location && (
                      <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <MapPin size={11} strokeWidth={2} />
                        <span>{event.location}</span>
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
