import { authenticated, failure, options, reply } from "@/lib/prelude-api";
import { getHolidays } from "@/lib/holidays";
export const OPTIONS = options;
export async function GET(request: Request) {
  try {
    await authenticated(request);
    const params = new URL(request.url).searchParams;
    const country = (params.get("country") || "NG").toUpperCase();
    const year = Number(params.get("year"));
    if (!/^[A-Z]{2}$/.test(country) || !Number.isInteger(year) || year < 2000 || year > 2100)
      return failure(request, "Choose a valid holiday country and year.");
    return reply(request, await getHolidays(country, year));
  } catch (error) {
    return failure(request, error instanceof Error && error.message === "Unauthorized"
      ? "Please sign in again to view holidays." : "Holiday information is temporarily unavailable.",
    error instanceof Error && error.message === "Unauthorized" ? 401 : 503);
  }
}
