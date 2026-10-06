import { frontendOrigins } from "./frontend-origins";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export function tokenKey() {
  const key = Buffer.from(process.env.MAIL_TOKEN_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("Email connection is not configured yet.");
  return key;
}
export function seal(value: unknown) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function unseal<T>(value: string): T {
  const data = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8"));
}
export function gmailConfig() {
  tokenKey();
  const clientId = process.env.GMAIL_CLIENT_ID, clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Gmail connection is not configured yet.");
  return { clientId, clientSecret, redirectUri };
}
export async function googleTokens(body: Record<string, string>) {
  const config = gmailConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...body }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Please reconnect your Gmail account.");
  return data as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
}
export function allowedReturn(request: Request, value: unknown) {
  if (typeof value !== "string") throw new Error("Invalid return address.");
  const url = new URL(value);
  const origins = frontendOrigins();
  if (url.origin !== new URL(request.url).origin && !origins.includes(url.origin)) throw new Error("Invalid return address.");
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.pathname.endsWith("/settings.html")) throw new Error("Invalid return address.");
  url.search = ""; url.hash = "email-import";
  return url.href;
}
