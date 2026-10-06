import { randomBytes } from "node:crypto";
import {
  admin,
  cors,
  email,
  failure,
  options,
  otpHash,
  reply,
  tokenHash,
} from "@/lib/prelude-api";
export const OPTIONS = options;
export async function POST(request: Request) {
  try {
    cors(request);
    const input = await request.json();
    const address = email(input.email);
    if (typeof input.code !== "string" || !/^\d{6}$/.test(input.code))
      return failure(request, "Enter the six-digit code.");
    const proof = randomBytes(32).toString("base64url");
    const { data, error } = await admin().rpc("prelude_verify_otp", {
      p_email: address,
      p_hash: otpHash(address, input.code),
      p_proof: tokenHash(proof),
    });
    if (error || !data)
      return failure(
        request,
        "Incorrect or expired code. Request a new code after three unsuccessful attempts.",
      );
    return reply(request, { verified: true, verificationToken: proof });
  } catch {
    return failure(request, "Unable to verify this code. Please try again.");
  }
}
