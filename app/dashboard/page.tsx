import { getHomeEvents } from "@/app/actions/events";
import { Countdown } from "@/components/Countdown";
import { TopBar } from "@/components/nav/TopBar";
import { BottomNav } from "@/components/nav/BottomNav";
import Link from "next/link";
import { Calendar, ChevronRight, MapPin, Sparkles, ArrowRight, Upload, CloudSun, Navigation } from "lucide-react";

export default async function DashboardPage() {
  const { hero, secondary } = await getHomeEvents();

  return (
    <main className="prelude-page">
      <TopBar />

      <section className="dashboard-content mt-2">
        {!hero ? (
          <div className="empty-state rise">
            <div className="empty-icon grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] mx-auto mb-4">
              <Sparkles size={28} strokeWidth={2} />
            </div>
            <div className="eyebrow">NOTHING PLANNED</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              What&rsquo;s next?
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Plan it. Prepare for it. Relive it as a memory.
            </p>
            <div className="mt-6">
              <Link href="/events/new" className="primary-button group">
                <span>Create your first event</span>
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="section-heading rise">
              <div>
                <div className="eyebrow">YOUR NEXT MOMENT</div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  What&rsquo;s coming up
                </h1>
              </div>
            </div>

            {/* Cinematic Hero Event Card */}
            <Link
              href={`/events/${hero.id}`}
              className="hero-event rise-1 group block"
            >
              <div className="hero-image relative">
                {hero.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hero.image_path}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="hero-placeholder h-full w-full" />
                )}

                {hero.is_priority && (
                  <span className="priority-pill">
                    Priority
                  </span>
                )}
              </div>

              <div className="hero-body">
                <div className="hero-title-row">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-white">
                      {hero.title}
                    </h2>

                    <p className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Calendar size={13} strokeWidth={2} className="text-[var(--accent)]" />
                      <span>{hero.date}</span>
                      {hero.time && <span>· {hero.time}</span>}
                    </p>

                    {hero.location && (
                      <p className="muted flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                        <MapPin size={12} strokeWidth={2} />
                        <span>{hero.location}</span>
                      </p>
                    )}
                  </div>

                  <span className="status-pill">
                    On track
                  </span>
                </div>

                <div className="mt-5">
                  <Countdown
                    date={hero.date}
                    time={hero.time ?? null}
                  />
                </div>
              </div>
            </Link>

            {/* Refined Secondary List */}
            {secondary.length > 0 && (
              <section className="secondary-events rise-2">
                <div className="section-heading small flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Other upcoming moments
                  </h2>
                  <Link
                    href="/events"
                    className="flex items-center text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    View all
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="flex flex-col gap-2">
                  {secondary.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="secondary-event group flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white">
                          {event.title}
                        </strong>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {event.date}
                          {event.time ? ` · ${event.time}` : ""}
                        </p>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section aria-labelledby="create-with-ai-title" className="feature-preview rise-2">
          <div className="eyebrow">A LITTLE HELP WITH THE DETAILS</div>
          <h2 id="create-with-ai-title" className="mt-2 text-lg font-bold text-[var(--text-primary)]">
            Create with AI
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Event details from a timetable, invitation, poster, or booking confirmation.
          </p>
          <div className="upload-placeholder mt-4" aria-describedby="upload-coming-soon">
            <span className="feature-icon"><Upload size={19} aria-hidden="true" /></span>
            <strong>Choose an image</strong>
            <span className="text-xs text-[var(--text-secondary)]">Timetables, invitations, event posters, or booking confirmations</span>
            <button className="feature-upload-action" type="button" disabled>Upload image · coming soon</button>
          </div>
          <p id="upload-coming-soon" className="feature-note mt-3">Image upload and event draft review are coming soon.</p>
        </section>

        <div className="feature-preview-grid rise-2">
          <section aria-labelledby="smart-location-title" className="feature-preview">
            <div className="feature-icon"><MapPin size={19} aria-hidden="true" /></div>
            <div className="eyebrow mt-4">FOR YOUR PLANS</div>
            <h2 id="smart-location-title" className="mt-1 text-lg font-bold text-[var(--text-primary)]">Smart Location</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">A place for location details, directions, and nearby places.</p>
            <div className="feature-placeholder mt-4" aria-label="Location details placeholder">
              <Navigation size={16} aria-hidden="true" />
              <span>Location details will appear here</span>
            </div>
            <p className="feature-note mt-3">Directions and nearby places are not available yet.</p>
          </section>

          <section aria-labelledby="weather-title" className="feature-preview">
            <div className="feature-icon"><CloudSun size={19} aria-hidden="true" /></div>
            <div className="eyebrow mt-4">AHEAD OF THE DAY</div>
            <h2 id="weather-title" className="mt-1 text-lg font-bold text-[var(--text-primary)]">Weather</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">A calm overview of weather for your event day.</p>
            <div className="feature-placeholder mt-4" aria-label="Weather information placeholder">
              <CloudSun size={16} aria-hidden="true" />
              <span>Event weather will appear here</span>
            </div>
            <p className="feature-note mt-3">Weather information is not available yet.</p>
          </section>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
