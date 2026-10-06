import { authenticated, failure, options, reply } from "@/lib/prelude-api";
export const OPTIONS = options;
export async function GET(request: Request) {
  try {
    await authenticated(request);
    const text = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (text.length < 3 || text.length > 150)
      return reply(request, { places: [] });
    if (!process.env.GEOAPIFY_API_KEY)
      return failure(
        request,
        "Location search isn't configured yet. You can add a location later.",
        503,
      );
    const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    url.search = new URLSearchParams({
      text,
      limit: "5",
      format: "json",
      apiKey: process.env.GEOAPIFY_API_KEY,
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Provider failed");
    const data = await response.json();
    return reply(request, {
      places: (data.results || []).map(
        (p: {
          formatted: string;
          lat: number;
          lon: number;
          place_id: string;
        }) => ({
          label: p.formatted,
          lat: p.lat,
          lon: p.lon,
          id: p.place_id,
          provider: "geoapify",
        }),
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return failure(request, "Please sign in again to search places.", 401);
    return failure(
      request,
      "We couldn't search locations. Please try again.",
      503,
    );
  }
}
