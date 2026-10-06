import { NextResponse } from "next/server";
import webpush from "web-push";
import { authenticated } from "@/lib/prelude-api";

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
        (host) =>
          url.hostname === host || url.hostname.endsWith("." + host),
      )
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { client, user } = await authenticated(request);

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      return NextResponse.json(
        { error: "Push notifications are not configured." },
        { status: 503 },
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const { data: subscriptions, error } = await client
      .from("push_subscriptions")
      .select("id,endpoint,p256dh_key,auth_key")
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { error: "No notification subscription exists for this account." },
        { status: 404 },
      );
    }

    const payload = JSON.stringify({
      title: "Prelude",
      body: "Notifications are working. You're ready for what's next.",
      tag: `prelude-test-${Date.now()}`,
      url: "index.html",
    });

    let delivered = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      if (!safeEndpoint(subscription.endpoint)) {
        failed++;
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key,
            },
          },
          payload,
          {
            TTL: 60,
            timeout: 10000,
          },
        );

        delivered++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;

        if (status === 404 || status === 410) {
          await client
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }

        failed++;
      }
    }

    return NextResponse.json({
      success: delivered > 0,
      delivered,
      failed,
    });
  } catch {
    return NextResponse.json(
      { error: "Test notification could not be sent." },
      { status: 500 },
    );
  }
}
