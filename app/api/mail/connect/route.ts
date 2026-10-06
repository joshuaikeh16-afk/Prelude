import { randomBytes, createHash } from "node:crypto";
import { authenticated, failure, options, reply, tokenHash } from "@/lib/prelude-api";
import { gmailConfig, allowedReturn, seal } from "@/lib/mail-security";
export function OPTIONS(request: Request) { const response = options(request); response.headers.set("Access-Control-Allow-Credentials", "true"); return response; }
export async function POST(request: Request) {
  try {
    const { client, user } = await authenticated(request);
    const config = gmailConfig(), input = await request.json();
    const returnUrl = allowedReturn(request, input.returnUrl);
    const state = randomBytes(32).toString("base64url"), verifier = randomBytes(32).toString("base64url");
    const { error } = await client.from("mail_oauth_states").insert({ state_hash: tokenHash(state), user_id: user.id,
      verifier_ciphertext: seal(verifier), return_url: returnUrl, expires_at: new Date(Date.now() + 600000).toISOString() });
    if (error) throw new Error("Email import needs its database update before you can connect.");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly", access_type: "offline", prompt: "consent", state,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
    const response = reply(request, { url: url.href });
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.cookies.set("prelude-mail-state", state, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/api/mail", maxAge: 600 });
    return response;
  } catch (error) {
    return failure(request, error instanceof Error ? error.message : "Couldn't connect Gmail.");
  }
}
