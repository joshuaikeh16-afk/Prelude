import { createClient } from "@supabase/supabase-js";
import { authenticated, failure, options, reply } from "@/lib/prelude-api";
import { validZone } from "@/lib/mail-events";
export const OPTIONS = options;
export async function GET(request: Request) {
  try {
    const {client, user} = await authenticated(request);
    const {data, error} = await client.from("mail_event_suggestions").select("id,source_subject,source_sender,payload,confidence").eq("user_id", user.id).eq("status", "pending").order("created_at", {ascending: false}).limit(50);
    if (error) throw error;
    const history = await client.from("mail_event_suggestions").select("id,payload,event_id,created_at")
      .eq("user_id", user.id).eq("status", "imported").order("created_at", {ascending: false}).limit(10);
    if (history.error) throw history.error;
    return reply(request, {suggestions: data, imported: history.data});
  } catch { return failure(request, "Email suggestions are unavailable. Please try again."); }
}
export async function POST(request: Request) {
  try {
    const {client, user} = await authenticated(request), input = await request.json();
    if (typeof input.id !== "string") return failure(request, "Choose an email suggestion.");
    if (input.action === "dismiss") {
      const {data, error} = await client.from("mail_event_suggestions").update({status: "dismissed"}).eq("id", input.id).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle();
      if (error || !data) throw new Error("Could not dismiss this suggestion.");
      return reply(request, {success: true});
    }
    const p = input.payload;
    if (input.action !== "create" || !p || typeof p.title !== "string" || !p.title.trim() || p.title.length > 120 ||
      typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
      typeof p.time !== "string" || (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) ||
      typeof p.timezone !== "string" || !validZone(p.timezone) || typeof p.location !== "string" || p.location.length > 500 ||
      typeof p.description !== "string" || p.description.length > 2000) return failure(request, "Check the event name, date, time and timezone.");
    const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {headers: {Authorization: request.headers.get("authorization")!}}, auth: {persistSession: false, autoRefreshToken: false},
    });
    const result = await userClient.rpc("prelude_import_mail_event", {p_suggestion: input.id, p_payload: p});
    if (result.error) throw new Error(result.error.message);
    return reply(request, {eventId: result.data});
  } catch (error) { return failure(request, error instanceof Error ? error.message : "Could not create this event."); }
}
