import Link from "next/link";
import Image from "next/image";
import { getUserEvents } from "@/app/actions/events";
import { BottomNav } from "@/components/nav/BottomNav";
import { Calendar, ChevronRight, MapPin, Plus, Search } from "lucide-react";

export default async function EventsPage() {
  const events = await getUserEvents();

  const upcoming = events.filter((event) => event.status !== "past");
  const past = events.filter((event) => event.status === "past");

  return (
    <main className="prelude-page">
      <div className="events-shell">
        <header className="events-header rise">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <Image src="/rixie-app-icon.png" alt="" width={28} height={28} className="rounded-[9px]" />
              <span>RIXIE</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Your Events
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

        {/* Polished search bar */}
        <div className="events-search rise-1">
          <Search size={16} strokeWidth={2} />
          <input
            type="search"
            placeholder="Find an event…"
            aria-label="Search events"
          />
        </div>

        {/* Upcoming events section */}
        <section className="events-section rise-2">
          <div className="events-section-header">
            <span>UPCOMING</span>
            <small>{upcoming.length}</small>
          </div>

          {upcoming.length === 0 ? (
            <div className="events-empty">
              <strong className="text-sm text-[var(--text-primary)]">Nothing coming up</strong>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Create an event to start preparing for what&rsquo;s next.
              </p>
            </div>
          ) : (
            <div className="event-list">
              {upcoming.map((event) => (
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
                        <Calendar size={11} strokeWidth={2} />
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

        {/* Past events / memories section */}
        <section className="events-section past-events rise-3">
          <div className="events-section-header">
            <span>MEMORIES & PAST</span>
            <small>{past.length}</small>
          </div>

          {past.length === 0 ? (
            <div className="events-empty">
              <strong className="text-sm text-[var(--text-primary)]">No memories yet</strong>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Completed events will live here with your photographs and reflection.
              </p>
            </div>
          ) : (
            <div className="event-list">
              {past.map((event) => (
                <Link
                  href={`/events/${event.id}`}
                  className="event-list-card group opacity-85 hover:opacity-100"
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
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1a20] to-[#101014]" />
                    )}
                  </div>

                  <div className="event-list-info">
                    <div className="event-list-top">
                      <span>
                        {new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
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
