import Link from "next/link";
import { getEventsInRange } from "@/app/actions/events";

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
        <header className="calendar-header">
          <div>
            <span className="prep-kicker">PRELUDE</span>
            <h1>Calendar</h1>
          </div>

          <Link href="/events/new" className="events-add">
            +
          </Link>
        </header>

        <section className="calendar-card">
          <div className="calendar-month-title">
            <h2>{monthName}</h2>
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
              const isToday =
                day === now.getDate();

              return (
                <div
                  className={`calendar-day ${
                    isToday ? "today" : ""
                  }`}
                  key={day}
                >
                  <span>{day}</span>

                  {hasEvent && (
                    <span className="calendar-dot" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="calendar-events">
          <div className="events-section-header">
            <span>THIS MONTH</span>
            <small>{events.length}</small>
          </div>

          {events.length === 0 ? (
            <div className="events-empty">
              <strong>No events this month</strong>
              <p>Your planned events will appear here.</p>
            </div>
          ) : (
            <div className="event-list">
              {events.map((event) => (
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
      </div>

      <nav className="bottom-nav">
        <Link href="/dashboard">Home</Link>
        <Link href="/events">Events</Link>
        <Link href="/events/new" className="create-nav">
          +
        </Link>
        <Link href="/calendar" className="active">
          Calendar
        </Link>
        <Link href="/profile">Profile</Link>
      </nav>
    </main>
  );
}
