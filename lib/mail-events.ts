import { createHash } from "node:crypto";
export type EventPayload = { title: string; date: string; time: string; timezone: string; location: string; description: string };
export type DetectedEvent = { key: string; confidence: "clear" | "review"; payload: EventPayload };
export function validZone(zone: string) {
  try { return new Intl.DateTimeFormat("en", {timeZone: zone}).resolvedOptions().timeZone; }
  catch { return null; }
}
function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
function text(value = "") { return value.replace(/\\[nN]/g, "\n").replace(/\\([,;\\])/g, "$1").trim(); }
function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).formatToParts(date);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  return {date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`};
}
function explicitDates(content: string) {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthPattern = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const dates = new Set<string>();
  for (const match of content.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)) if (validDate(match[1])) dates.add(match[1]);
  for (const reversed of [false, true]) {
    const pattern = reversed ? `${monthPattern}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(20\\d{2})` : `(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthPattern}\\s*,?\\s*(20\\d{2})`;
    for (const match of content.matchAll(new RegExp(`\\b${pattern}\\b`, "gi"))) {
      const day = reversed ? match[2] : match[1], month = reversed ? match[1] : match[2];
      const date = `${match[3]}-${String(months.indexOf(month.slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
      if (validDate(date)) dates.add(date);
    }
  }
  return dates;
}
export function detectMailEvents(subject: string, body: string, calendars: string[], defaultZone: string, now = new Date()): DetectedEvent[] {
  const timezone = validZone(defaultZone) || "UTC";
  const detected: DetectedEvent[] = [];
  for (const calendar of calendars) {
    const unfolded = calendar.replace(/\r?\n[ \t]/g, "");
    // Recurring series, cancellations and updates need a separate scheduling workflow.
    if (/^METHOD:CANCEL\s*$/mi.test(unfolded)) continue;
    for (const block of unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)) {
      const values = new Map<string, {value: string; params: string}>();
      for (const line of block[1].split(/\r?\n/)) {
        const colon = line.indexOf(":");
        if (colon < 0) continue;
        const [key, ...params] = line.slice(0, colon).split(";");
        values.set(key.toUpperCase(), {value: line.slice(colon + 1), params: params.join(";")});
      }
      if (values.has("RRULE") || values.has("RECURRENCE-ID") || values.get("STATUS")?.value === "CANCELLED") continue;
      const start = values.get("DTSTART"), title = text(values.get("SUMMARY")?.value || subject).slice(0, 120);
      if (!start || !title) continue;
      const match = start.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
      if (!match) continue;
      let date = `${match[1]}-${match[2]}-${match[3]}`, time = match[4] ? `${match[4]}:${match[5]}` : "";
      if (!validDate(date) || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) continue;
      const zoneParam = start.params.match(/(?:^|;)TZID="?([^;"]+)"?/i)?.[1];
      const zone = zoneParam ? validZone(zoneParam) : timezone;
      if (!zone) continue;
      let eventZone = zone;
      if (match[7]) {
        ({date, time} = localParts(new Date(`${date}T${time}:${match[6] || "00"}Z`), timezone));
        eventZone = timezone;
      }
      const current = localParts(now, eventZone);
      if (date < current.date || (date === current.date && time && time <= current.time)) continue;
      const uid = text(values.get("UID")?.value);
      const payload = {title, date, time, timezone: eventZone, location: text(values.get("LOCATION")?.value).slice(0, 500), description: text(values.get("DESCRIPTION")?.value).slice(0, 2000)};
      detected.push({key: createHash("sha256").update(uid || JSON.stringify(payload)).digest("hex"), confidence: (!time || match[7] || zoneParam) ? "clear" : "review", payload});
    }
  }
  // Never reinterpret a cancelled/recurring calendar attachment as a plain event.
  if (calendars.length || !/\b(meeting|appointment|invitation|event|reservation|booking)\b/i.test(subject + "\n" + body)) return detected;
  const content = `${subject}\n${body}`;
  const dates = explicitDates(content);
  // Explicit full years only: locale-dependent numeric and relative dates are never guessed.
  const date = [...dates][0];
  if (!date) return [];
  const times = new Set<string>();
  for (const match of content.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi)) {
    let hour = Number(match[1] || match[4]);
    const minute = match[2] || match[5] || "00";
    if (match[3]) {
      if (hour < 1 || hour > 12 || Number(minute) > 59) continue;
      hour = hour % 12 + (match[3].toLowerCase() === "pm" ? 12 : 0);
    }
    times.add(`${String(hour).padStart(2, "0")}:${minute}`);
  }
  const time = [...times][0] || "";
  const explicitZone = body.match(/^(?:timezone|time zone)\s*:\s*(\S+)\s*$/mi)?.[1];
  const eventZone = (explicitZone && validZone(explicitZone)) || timezone;
  const current = localParts(now, eventZone);
  if (date < current.date || (date === current.date && time && time <= current.time)) return [];
  const location = body.match(/^(?:location|venue)\s*:\s*([^\n]+)/mi)?.[1].trim().slice(0, 500) || "";
  // Auto-import only a single, labelled confirmation with an explicit IANA timezone.
  // A keyword, a guessed timezone, alternatives or quoted correspondence cannot qualify.
  const clear = dates.size === 1 && times.size === 1 && !!explicitZone && !!validZone(explicitZone) && !!location &&
    explicitDates(body.match(/^date\s*:\s*([^\n]+)/mi)?.[1] || "").has(date) &&
    /^time\s*:\s*(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|(?:[01]?\d|2[0-3]):[0-5]\d)\s*$/mi.test(body) &&
    /\b(confirmed|confirmation|you are invited|we have a meeting|your (?:meeting|appointment|reservation|booking))\b/i.test(content) &&
    !/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(content) &&
    !/not confirmed|no meeting|\b(maybe|perhaps|possible|tentative|proposed|could|might|rescheduled|cancelled|canceled)\b|^>|wrote:|forwarded message/im.test(content);
  const payload = {title: subject.trim().slice(0, 120), date, time, timezone: eventZone, location,
    description: clear ? "Added from Gmail." : "Suggested from email. Please confirm the date, time and timezone."};
  return payload.title ? [{key: createHash("sha256").update(JSON.stringify({...payload, description: "Suggested from email. Please confirm the date, time and timezone."})).digest("hex"), confidence: clear ? "clear" : "review", payload}] : [];
}
