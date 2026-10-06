export type Holiday = { name: string; date: string };
export type HolidayResult = { available: boolean; holidays: Holiday[]; partial?: boolean; note?: string };

// Verified government declarations; lunar dates are year-specific, never extrapolated.
const announcedNigeria: Record<number, Holiday[]> = {
  2026: [
    // https://interior.gov.ng/federal-government-declares-thursday-19th-and-friday-20th-march-2026-as-public-holidays-to-mark-eid-ul-fitr/
    {name: "Eid-ul-Fitr", date: "2026-03-19"}, {name: "Eid-ul-Fitr holiday", date: "2026-03-20"},
    // https://fmino.gov.ng/federal-government-declares-wednesday-27th-may-and-thursday-28th-may-2026-as-public-holidays-to-mark-eid-ul-adha-celebration/
    {name: "Eid-ul-Adha", date: "2026-05-27"}, {name: "Eid-ul-Adha holiday", date: "2026-05-28"},
    // https://interior.gov.ng/news-media/press-release/ (declaration dated 21 August 2026)
    {name: "Eid-ul-Mawlid", date: "2026-08-25"},
  ],
};
// Gregorian Easter and recurring statutory dates.
export function nigeriaHolidays(year: number): Holiday[] {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = (h + l - 7 * m + 114) % 31 + 1;
  const easter = new Date(Date.UTC(year, month - 1, day));
  const offset = (days: number) => new Date(easter.getTime() + days * 86400000).toISOString().slice(0, 10);
  return [
    { name: "New Year’s Day", date: `${year}-01-01` },
    { name: "Good Friday", date: offset(-2) },
    { name: "Easter Monday", date: offset(1) },
    { name: "Workers’ Day", date: `${year}-05-01` },
    { name: "Democracy Day", date: `${year}-${year >= 2019 ? "06-12" : "05-29"}` },
    { name: "Independence Day", date: `${year}-10-01` },
    { name: "Christmas Day", date: `${year}-12-25` },
    { name: "Boxing Day", date: `${year}-12-26` },
    ...(announcedNigeria[year] || []),
  ];
}
function normalize(rows: Holiday[], year: number) {
  return [...new Map(rows.filter(h => typeof h.name === "string" && typeof h.date === "string" &&
    h.date.startsWith(`${year}-`) && /^\d{4}-\d{2}-\d{2}$/.test(h.date))
    .map(h => [`${h.date}:${h.name}`, h])).values()].sort((a, b) => a.date.localeCompare(b.date));
}
export async function getHolidays(country: string, year: number, fetcher = fetch): Promise<HolidayResult> {
  if (process.env.CALENDARIFIC_API_KEY) {
    try {
      const url = new URL("https://calendarific.com/api/v2/holidays");
      url.search = new URLSearchParams({ api_key: process.env.CALENDARIFIC_API_KEY, country, year: String(year), type: "national" }).toString();
      const response = await fetcher(url, { signal: AbortSignal.timeout(7000), next: { revalidate: 21600 } });
      const data = await response.json();
      if (!response.ok || data.meta?.code !== 200 || !Array.isArray(data.response?.holidays)) throw new Error("Holiday feed unavailable");
      const holidays = normalize(data.response.holidays.map((h: {name: string; date: {iso: string}}) => ({name: h.name, date: h.date.iso.slice(0, 10)})), year);
      if (holidays.length) return { available: true, holidays };
    } catch { /* Try the independent provider before falling back. */ }
  }
  try {
    const response = await fetcher(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { signal: AbortSignal.timeout(7000), next: { revalidate: 21600 } });
    if (response.ok && response.status !== 204) {
      const data = await response.json();
      if (Array.isArray(data)) {
        // Regional holidays should not be presented as national holidays.
        const holidays = normalize(data.filter(h => h.global === true && (!h.types || h.types.includes("Public"))).map(h => ({name: h.name, date: h.date})), year);
        if (holidays.length) return { available: true, holidays };
      }
    }
  } catch { /* Nigeria has a deterministic fallback. */ }
  if (country === "NG") return { available: true, partial: true, holidays: normalize(nigeriaHolidays(year), year), note: announcedNigeria[year] ? "Showing recurring holidays and verified 2026 government declarations. Further declarations and substitute days require the live holiday feed." : "Showing recurring Nigerian holidays. Eid dates, substitute days and special government declarations require the live holiday feed." };
  return { available: false, holidays: [], note: "The national holiday feed is unavailable. Please try again later." };
}
