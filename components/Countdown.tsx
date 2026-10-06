"use client";

import { useEffect, useState } from "react";

function getTargetDate(date: string, time: string | null): Date {
  return new Date(time ? `${date}T${time}` : `${date}T00:00:00`);
}

function getRemaining(ms: number) {
  if (ms <= 0) return null;

  const totalMinutes = Math.floor(ms / 60000);

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

function Unit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="countdown-unit">
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

export function Countdown({
  date,
  time,
}: {
  date: string;
  time: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());

    update();

    const interval = setInterval(update, 60_000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="countdown-grid">
        <Unit value={0} label="DAYS" />
        <Unit value={0} label="HRS" />
        <Unit value={0} label="MIN" />
      </div>
    );
  }

  const target = getTargetDate(date, time);
  const diff = target.getTime() - now.getTime();
  const remaining = getRemaining(diff);

  if (diff <= 0) {
    const sameDay = target.toDateString() === now.toDateString();

    return (
      <div className={sameDay ? "event-status today" : "event-status"}>
        {sameDay ? "Happening today" : "Event completed"}
      </div>
    );
  }

  if (!remaining) return null;

  return (
    <div className="countdown-grid">
      <Unit value={remaining.days} label="DAYS" />
      <Unit value={remaining.hours} label="HRS" />
      <Unit value={remaining.minutes} label="MIN" />
    </div>
  );
}
