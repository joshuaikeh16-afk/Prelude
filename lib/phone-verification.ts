import crypto from "node:crypto";

type VerificationPayload = {
  phone: string;
  otpId: string;
  exp: number;
};

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  const secret = process.env.PHONE_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error("PHONE_VERIFICATION_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createPhoneVerificationToken(
  phone: string,
  otpId: string
) {
  const payload: VerificationPayload = {
    phone,
    otpId,
    exp: Date.now() + 10 * 60 * 1000,
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyPhoneVerificationToken(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    throw new Error("Invalid verification token");
  }

  const expectedSignature = sign(encodedPayload);

  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature)
  );

  if (!signaturesMatch) {
    throw new Error("Invalid verification token");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  ) as VerificationPayload;

  if (payload.exp < Date.now()) {
    throw new Error("Verification token has expired");
  }

  return payload;
}
