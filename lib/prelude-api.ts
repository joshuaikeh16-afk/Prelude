import { frontendOrigins } from "./frontend-origins";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash, createHmac } from "node:crypto";
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = frontendOrigins();
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    !allowed.includes(origin)
  )
    throw new Error("Origin denied");
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
}
export function options(request: Request) {
  try {
    return new NextResponse(null, { status: 204, headers: cors(request) });
  } catch {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
}
export function reply(request: Request, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: cors(request) });
}
export async function authenticated(request: Request) {
  cors(request);
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("Unauthorized");
  const client = admin();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return { client, user: data.user };
}
export function email(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new Error("Invalid email");
  return value.trim().toLowerCase();
}
export const otpHash = (address: string, code: string) =>
  createHmac(
    "sha256",
    process.env.EMAIL_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
    .update(`${address}\n${code}`)
    .digest("hex");
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function failure(
  request: Request,
  message = "This service is unavailable. Please try again.",
  status = 400,
) {
  try {
    return reply(request, { error: message }, status);
  } catch {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
}
