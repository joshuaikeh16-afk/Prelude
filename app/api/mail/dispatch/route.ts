import { NextResponse } from "next/server";
import { admin } from "@/lib/prelude-api";
import { scanMailbox } from "@/lib/gmail";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  try {
    const client = admin();
  await client.from("mail_oauth_states").delete().lt("expires_at", new Date().toISOString());
  const {data, error} = await client.from("mail_connections").select("*")
    .or(`last_scan_attempt_at.is.null,last_scan_attempt_at.lt.${new Date(Date.now() - 15 * 60000).toISOString()}`)
    .order("last_scan_attempt_at", {ascending: true, nullsFirst: true}).limit(3);
  if (error) return NextResponse.json({error: "Email import database setup is required."}, {status: 503});
  const results = await Promise.allSettled((data || []).map(async connection => {
    const {data: account, error} = await client.auth.admin.getUserById(connection.user_id);
    if (error || !account.user) {
      await client.from("mail_connections").update({last_scan_attempt_at: new Date().toISOString(), last_scan_error: "Account unavailable. Please reconnect Gmail."}).eq("id", connection.id);
      throw new Error("Account unavailable");
    }
    return scanMailbox(connection, account.user.user_metadata?.prelude_profile?.preferences?.timezone || "UTC");
  }));
  return NextResponse.json({checked: results.length, succeeded: results.filter(r => r.status === "fulfilled" && !r.value.busy && !r.value.importFailures).length,
    failed: results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && r.value.importFailures > 0)).length}, {headers: {"Cache-Control": "no-store"}});
  } catch { return NextResponse.json({error: "Gmail scanning is temporarily unavailable."}, {status: 503}); }
}
export const POST = GET;
