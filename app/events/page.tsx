import Link from "next/link";
import { getUserEvents } from "@/app/actions/events";

export default async function EventsPage() {
  const events = await getUserEvents();

  const upcoming = events.filter((event) => event.status !== "past");
  const past = events.filter((event) => event.status === "past");

  return (
    <main className="prelude-page">
      <div className="events-shell">
        <header className="events-header">
          <div>
            <span className="prep-kicker">PRELUDE</span>
            <h1>Events</h1>
          </div>

          <Link href="/events/new" className="events-add">
            +
          </Link>
        </header>

        <div className="events-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search events..."
          />
        </div>

        <section className="events-section">
          <div className="events-section-header">
            <span>UPCOMING</span>
            <small>{upcoming.length}</small>
          </div>

          {upcoming.length === 0 ? (
            <div className="events-empty">
              <strong>Nothing coming up</strong>
              <p>Create an event to start preparing.</p>
            </div>
          ) : (
            <div className="event-list">
              {upcoming.map((event) => (
                <Link
                  href={`/events/${event.id}`}
                  className="event-list-card"
                  key={event.id}
                >
                  <div className="event-list-image">
                    {event.image_path ? (
                      <img src={event.image_path} alt="" />
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="event-list-info">
                    <div className="event-list-top">
                      <span>
                        {new Date(
                          `${event.date}T00:00:00`
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {event.is_priority && (
                        <b>PRIORITY</b>
                      )}
                    </div>

                    <h2>{event.title}</h2>

                    {event.location && (
                      <p>{event.location}</p>
                    )}
                  </div>

                  <span className="event-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="events-section past-events">
          <div className="events-section-header">
            <span>PAST</span>
            <small>{past.length}</small>
          </div>

          {past.length === 0 ? (
            <div className="events-empty">
              <strong>No memories yet</strong>
              <p>Past events will appear here.</p>
            </div>
          ) : (
            <div className="event-list">
              {past.map((event) => (
                <Link
                  href={`/events/${event.id}`}
                  className="event-list-card"
                  key={event.id}
                >
                  <div className="event-list-image">
                    {event.image_path ? (
                      <img src={event.image_path} alt="" />
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="event-list-info">
                    <div className="event-list-top">
                      <span>
                        {new Date(
                          `${event.date}T00:00:00`
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2>{event.title}</h2>

                    {event.location && (
                      <p>{event.location}</p>
                    )}
                  </div>

                  <span className="event-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className="bottom-nav">
        <Link href="/dashboard">Home</Link>
        <Link href="/events" className="active">
          Events
        </Link>
        <Link href="/events/new" className="create-nav">
          +
        </Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/profile">Profile</Link>
      </nav>
    </main>
  );
}
