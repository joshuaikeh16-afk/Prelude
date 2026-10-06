import { failure, options, reply } from "@/lib/prelude-api";
export const OPTIONS = options;
export function GET(request: Request) {
  try {
    return reply(request, {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  } catch {
    return failure(request);
  }
}
