import { NextRequest, NextResponse } from "next/server";
import { admin, tokenHash } from "@/lib/prelude-api";
import { gmailConfig, googleTokens, seal, unseal } from "@/lib/mail-security";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams, state = params.get("state");
  if (!state || state !== request.cookies.get("prelude-mail-state")?.value)
    return NextResponse.json({ error: "This Gmail connection expired. Return to Settings and connect again." }, {status: 400});
  const client = admin();
  const { data: row, error } = await client.from("mail_oauth_states").delete().eq("state_hash", tokenHash(state)).gt("expires_at", new Date().toISOString()).select("*").maybeSingle();
  if (error || !row) return NextResponse.json({error: "This connection has expired. Please connect again."}, {status: 400});
  const destination = new URL(row.return_url);
  try {
    if (params.has("error") || !params.get("code")) throw new Error("Consent declined");
    const config = gmailConfig();
    const tokens = await googleTokens({code: params.get("code")!, grant_type: "authorization_code", redirect_uri: config.redirectUri, code_verifier: unseal<string>(row.verifier_ciphertext)});
    if (!tokens.scope?.split(" ").includes("https://www.googleapis.com/auth/gmail.readonly") || !tokens.refresh_token) throw new Error("Read permission missing");
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {headers: {Authorization: `Bearer ${tokens.access_token}`}, signal: AbortSignal.timeout(10000)});
    const profile = await response.json();
    if (!response.ok || typeof profile.emailAddress !== "string") throw new Error("Mailbox unavailable");
    const result = await client.from("mail_connections").upsert({user_id: row.user_id, provider: "gmail", email: profile.emailAddress.toLowerCase(),
      tokens_ciphertext: seal({accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + tokens.expires_in * 1000})}, {onConflict: "user_id,provider,email"});
    if (result.error) throw new Error("Could not save connection");
    destination.searchParams.set("mail", "connected");
  } catch { destination.searchParams.set("mail", "failed"); }
  const response = NextResponse.redirect(destination);
  response.cookies.delete({name: "prelude-mail-state", path: "/api/mail"});
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
