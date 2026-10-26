"use client";

import { useEffect, useState } from "react";

function getTargetDate(date: string, time: string | null): Date {
  return new Date(time ? `${date}T${time}` : `${date}T00:00:00`);
}

function getRemaining(ms: number) {
  if (ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  };
}

function DigitPad({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const formatted = String(value).padStart(2, "0");

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-black/45 px-3 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-200">
      <div className="relative flex h-9 items-center justify-center overflow-hidden">
        <span
          className="font-mono text-3xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatted}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
        {label}
      </span>
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
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        <DigitPad value={0} label="DAYS" />
        <DigitPad value={0} label="HRS" />
        <DigitPad value={0} label="MIN" />
      </div>
    );
  }

  const target = getTargetDate(date, time);
  const diff = target.getTime() - now.getTime();
  const remaining = getRemaining(diff);

  if (diff <= 0) {
    const sameDay = target.toDateString() === now.toDateString();

    return (
      <div
        className={`flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide transition-all ${
          sameDay
            ? "border border-[var(--accent-border,rgba(255,59,100,0.35))] bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-[0_0_24px_var(--accent-glow)] animate-pulse"
            : "border border-white/[0.08] bg-white/[0.04] text-[var(--text-secondary)]"
        }`}
      >
        {sameDay ? "✦ Happening today" : "Event completed"}
      </div>
    );
  }

  if (!remaining) return null;

  return (
    <div className="grid grid-cols-3 gap-2.5">
      <DigitPad value={remaining.days} label="DAYS" />
      <DigitPad value={remaining.hours} label="HRS" />
      <DigitPad value={remaining.minutes} label="MIN" />
    </div>
  );
}
