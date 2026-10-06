import { authenticated, failure, options, reply } from "@/lib/prelude-api";
import { googleTokens, seal } from "@/lib/mail-security";
export const OPTIONS = options;
export async function POST(request: Request) {
  try {
    const {client, user} = await authenticated(request), input = await request.json();
    if (typeof input.refreshToken !== "string" || !input.refreshToken || input.refreshToken.length > 4096)
      return failure(request, "Please allow Gmail access through Google again.");
    const googleIdentity = user.identities?.find(identity => identity.provider === "google");
    const expectedEmail = googleIdentity?.identity_data?.email;
    if (typeof expectedEmail !== "string") return failure(request, "Please use Google sign-in to grant access to this Gmail account.", 403);
    // Exchange the refresh token server-side: its owner and scopes are verified by Google,
    // rather than trusting an email address or access-token expiry supplied by the browser.
    const tokens = await googleTokens({grant_type: "refresh_token", refresh_token: input.refreshToken});
    if (!tokens.scope?.split(" ").includes("https://www.googleapis.com/auth/gmail.readonly"))
      return failure(request, "Google sign-in succeeded, but Gmail reading permission was not granted.", 403);
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: {Authorization: `Bearer ${tokens.access_token}`}, signal: AbortSignal.timeout(10000),
    });
    const profile = await response.json();
    if (!response.ok || typeof profile.emailAddress !== "string" || profile.emailAddress.toLowerCase() !== expectedEmail.toLowerCase())
      return failure(request, "The Gmail permission must belong to the Google account you signed in with.", 403);
    const result = await client.from("mail_connections").upsert({user_id: user.id, provider: "gmail", email: profile.emailAddress.toLowerCase(),
      tokens_ciphertext: seal({accessToken: tokens.access_token, refreshToken: tokens.refresh_token || input.refreshToken, expiresAt: Date.now() + tokens.expires_in * 1000})}, {onConflict: "user_id,provider,email"});
    if (result.error) return failure(request, "Gmail import needs its database setup before permission can be saved.", 503);
    return reply(request, {success: true});
  } catch (error) {
    return failure(request, error instanceof Error ? error.message : "Could not enable Gmail import.");
  }
}
