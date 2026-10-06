import { randomInt } from "node:crypto";
import { Resend } from "resend";
import {
  admin,
  cors,
  email,
  failure,
  options,
  otpHash,
  reply,
} from "@/lib/prelude-api";
export const OPTIONS = options;
export async function POST(request: Request) {
  try {
    cors(request);
    const address = email((await request.json()).email);
    const code = String(randomInt(100000, 1000000));
    const client = admin();
    const { data: id, error } = await client.rpc("prelude_issue_otp", {
      p_email: address,
      p_hash: otpHash(address, code),
      p_production: process.env.NODE_ENV === "production",
    });
    if (error)
      return failure(
        request,
        error.message.includes("Please wait")
          ? "Please wait before requesting another code."
          : "Verification is temporarily unavailable.",
        error.message.includes("Please wait") ? 429 : 503,
      );
    const sent = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM || "Prelude <onboarding@resend.dev>",
      to: address,
      subject: "Your Prelude verification code",
      html: `<p>Your Prelude verification code:</p><h1>${code}</h1><p>It expires in 10 minutes.</p>`,
    });
    if (sent.error) {
      await client
        .from("email_verification_otps")
        .update({ invalidated_at: new Date().toISOString() })
        .eq("id", id);
      return failure(
        request,
        "We couldn't deliver your code. Please try again.",
        503,
      );
    }
    return reply(request, {
      success: true,
      cooldown: process.env.NODE_ENV === "production" ? 60 : 0,
    });
  } catch {
    return failure(
      request,
      "Unable to send a code. Check your email and try again.",
    );
  }
}
