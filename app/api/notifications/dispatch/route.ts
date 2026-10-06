import { NextResponse } from "next/server";
import webpush from "web-push";
import { admin } from "@/lib/prelude-api";
export const runtime = "nodejs";
function safeEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
        "notify.windows.com",
      ].some(
        (host) => url.hostname === host || url.hostname.endsWith("." + host),
      )
    );
  } catch {
    return false;
  }
}
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const client = admin();
    const synced = await client.rpc("prelude_sync_events");
    if (synced.error)
      return NextResponse.json(
        { error: "Lifecycle migration is unavailable." },
        { status: 503 },
      );
    if (
      !process.env.VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY ||
      !process.env.VAPID_SUBJECT
    )
      return NextResponse.json(
        { synced: true, error: "Push delivery needs VAPID configuration." },
        { status: 503 },
      );
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    const [reminders, timers] = await Promise.all([
      client.rpc("prelude_claim_reminders", { p_limit: 50 }),
      client.rpc("prelude_claim_timer_alerts", { p_limit: 50 }),
    ]);
    if (reminders.error || timers.error)
      return NextResponse.json(
        { error: "Notification migration is unavailable." },
        { status: 503 },
      );
    let delivered = 0,
      failed = 0;
    type Alert = {
      id: string;
      user_id: string;
      event_id: string;
      title?: string;
      task_id?: string;
      task_title?: string;
    };
    async function send(alert: Alert, timer: boolean) {
      const [account, subscriptions] = await Promise.all([
        client.auth.admin.getUserById(alert.user_id),
        client
          .from("push_subscriptions")
          .select("id,endpoint,p256dh_key,auth_key")
          .eq("user_id", alert.user_id),
      ]);
      if (account.error || subscriptions.error) return "retry";
      if (
        !account.data.user?.user_metadata?.prelude_profile?.preferences
          ?.notifications
      )
        return "skipped";
      const payload = JSON.stringify({
        title: timer ? "Time’s up" : "Prelude",
        body: timer
          ? `${alert.task_title} is still incomplete. Open it to finish or extend.`
          : alert.title,
        tag: timer ? `timer-${alert.id}` : `reminder-${alert.id}`,
        url: `event.html?id=${alert.event_id}${timer ? `&task=${alert.task_id}` : ""}`,
      });
      let success = false;
      for (const sub of subscriptions.data || []) {
        if (!safeEndpoint(sub.endpoint)) continue;
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
            },
            payload,
            { TTL: 3600, timeout: 10000 },
          );
          success = true;
          delivered++;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410)
            await client.from("push_subscriptions").delete().eq("id", sub.id);
          else failed++;
        }
      }
      // No subscriptions: consume this alert rather than retrying something undeliverable.
      return success
        ? "sent"
        : !(subscriptions.data || []).length
          ? "skipped"
          : "retry";
    }
    for (const reminder of (reminders.data || []) as Alert[]) {
      const outcome = await send(reminder, false);
      if (outcome !== "retry")
        await client
          .from("reminders")
          .update({
            sent_at: outcome === "sent" ? new Date().toISOString() : null,
            status: outcome === "sent" ? "sent" : "cancelled",
            claimed_at: null,
          })
          .eq("id", reminder.id);
    }
    for (const timer of (timers.data || []) as Alert[]) {
      if ((await send(timer, true)) !== "retry")
        await client
          .from("task_sessions")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", timer.id);
    }
    await client
      .from("reminders")
      .update({ status: "failed" })
      .eq("status", "pending")
      .gte("attempts", 5);
    return NextResponse.json({
      synced: true,
      claimed: (reminders.data || []).length + (timers.data || []).length,
      delivered,
      failed,
    });
  } catch {
    return NextResponse.json(
      { error: "Notification delivery is temporarily unavailable." },
      { status: 503 },
    );
  }
}
