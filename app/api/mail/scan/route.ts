import { authenticated, failure, options, reply } from "@/lib/prelude-api";
import { scanMailbox } from "@/lib/gmail";
export const OPTIONS = options;
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const {client, user} = await authenticated(request), input = await request.json();
    if (typeof input.id !== "string") return failure(request, "Choose a connected Gmail account.");
    const {data, error} = await client.from("mail_connections").select("*").eq("id", input.id).eq("user_id", user.id).maybeSingle();
    if (error || !data) return failure(request, "This Gmail connection is unavailable.", 404);
    return reply(request, await scanMailbox(data, user.user_metadata?.prelude_profile?.preferences?.timezone || "UTC"));
  } catch (error) { return failure(request, error instanceof Error ? error.message : "Could not check Gmail.", 503); }
}
