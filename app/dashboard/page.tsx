import { getHomeEvents } from "@/app/actions/events";
import { Countdown } from "@/components/Countdown";
import Link from "next/link";

export default async function DashboardPage() {
  const { hero, secondary } = await getHomeEvents();

  return (
    <main className="prelude-page">
      <header className="prelude-header">
        <div>
          <div className="eyebrow">PRELUDE</div>
          <p>Prepare for what’s next.</p>
        </div>

        <div className="header-actions">
          <button className="icon-button" aria-label="Notifications">
            ♧
          </button>

          <Link href="/profile" className="avatar-button">
            A
          </Link>
        </div>
      </header>

      <section className="dashboard-content">
        {!hero ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <div className="eyebrow">NOTHING PLANNED</div>
            <h1>What’s next?</h1>
            <p>
              Nothing planned yet. What are you looking forward to?
            </p>
            <Link href="/events/new" className="primary-button">
              Create Event
            </Link>
          </div>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR NEXT MOMENT</div>
                <h1>What’s coming up</h1>
              </div>
            </div>

            <Link
              href={`/events/${hero.id}`}
              className="hero-event"
            >
              <div className="hero-image">
                {hero.image_path ? (
                  <img src={hero.image_path} alt="" />
                ) : (
                  <div className="hero-placeholder" />
                )}

                {hero.is_priority && (
                  <span className="priority-pill">Priority</span>
                )}
              </div>

              <div className="hero-body">
                <div className="hero-title-row">
                  <div>
                    <h2>{hero.title}</h2>

                    <p>
                      {hero.date}
                      {hero.time ? ` · ${hero.time}` : ""}
                    </p>

                    {hero.location && (
                      <p className="muted">{hero.location}</p>
                    )}
                  </div>

                  <span className="status-pill">On track</span>
                </div>

                <div className="mt-5">
                  <Countdown
                    date={hero.date}
                    time={hero.time ?? null}
                  />
                </div>
              </div>
            </Link>

            {secondary.length > 0 && (
              <section className="secondary-events">
                <div className="section-heading small">
                  <h2>Other upcoming</h2>
                  <span>Within your range</span>
                </div>

                {secondary.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="secondary-event"
                  >
                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {event.date}
                        {event.time ? ` · ${event.time}` : ""}
                      </p>
                    </div>

                    <span>›</span>
                  </Link>
                ))}
              </section>
            )}
          </>
        )}
      </section>

      <nav className="bottom-nav">
        <Link href="/dashboard" className="active">
          <span>⌂</span>
          Home
        </Link>

        <Link href="/events">
          <span>◫</span>
          Events
        </Link>

        <Link href="/events/new" className="create-button">
          +
        </Link>

        <Link href="/calendar">
          <span>▦</span>
          Calendar
        </Link>
      </nav>
    </main>
  );
}
