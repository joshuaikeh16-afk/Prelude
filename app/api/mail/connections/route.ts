import { authenticated, failure, options, reply } from "@/lib/prelude-api";
import { gmailConfig, unseal } from "@/lib/mail-security";
export const OPTIONS = options;
export async function GET(request: Request) {
  try {
    const {client, user} = await authenticated(request);
    let configured = true;
    try { gmailConfig(); } catch { configured = false; }
    const {data, error} = await client.from("mail_connections").select("id,email,auto_import,last_scan_at,last_scan_error").eq("user_id", user.id).order("created_at");
    if (error) return reply(request, {configured: false, connections: [], setupRequired: true});
    return reply(request, {configured, connections: data});
  } catch { return failure(request, "Please sign in again to manage Gmail.", 401); }
}
export async function POST(request: Request) {
  try {
    const {client, user} = await authenticated(request), input = await request.json();
    if (typeof input.id !== "string" || typeof input.autoImport !== "boolean") return failure(request, "Choose a connected Gmail account.");
    const {data, error} = await client.from("mail_connections").update({auto_import: input.autoImport}).eq("id", input.id).eq("user_id", user.id).select("id").maybeSingle();
    if (error || !data) throw new Error("Connection unavailable");
    return reply(request, {success: true});
  } catch { return failure(request, "Could not save your email import preference."); }
}
export async function DELETE(request: Request) {
  try {
    const {client, user} = await authenticated(request), input = await request.json();
    if (typeof input.id !== "string") return failure(request, "Choose a connected Gmail account.");
    const {data, error} = await client.from("mail_connections").delete().eq("id", input.id).eq("user_id", user.id).select("tokens_ciphertext").maybeSingle();
    if (error || !data) throw new Error("Connection unavailable");
    // Removing local credentials is immediate; revocation is best effort.
    let revoked = false;
    try {
      const tokens = unseal<{refreshToken: string}>(data.tokens_ciphertext);
      const response = await fetch("https://oauth2.googleapis.com/revoke", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: new URLSearchParams({token: tokens.refreshToken}), signal: AbortSignal.timeout(5000)});
      revoked = response.ok;
    } catch { /* Credentials and pending suggestions have already been deleted. */ }
    return reply(request, {success: true, revoked});
  } catch { return failure(request, "Could not disconnect Gmail. Please try again."); }
}
