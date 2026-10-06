import { NextResponse } from "next/server";
import { Robase } from "@robasedev/sdk";
import { createClient } from "@supabase/supabase-js";
import { createPhoneVerificationToken } from "@/lib/phone-verification";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:8080",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const robase = new Robase({
  apiKey: process.env.ROBASE_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const { otpId, code, phone } = await request.json();

    if (!otpId || !code || !phone) {
      return NextResponse.json(
        {
          error: "Phone, OTP ID and verification code are required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find this exact OTP record.
    const { data: otpRecord, error: lookupError } =
      await supabaseAdmin
        .from("phone_verification_otps")
        .select("*")
        .eq("phone", phone)
        .eq("otp_id", otpId)
        .is("invalidated_at", null)
        .maybeSingle();

    if (lookupError || !otpRecord) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "This verification code is no longer valid. Please request a new code.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check expiration.
    if (new Date(otpRecord.expires_at).getTime() <= Date.now()) {
      await supabaseAdmin
        .from("phone_verification_otps")
        .update({
          invalidated_at: new Date().toISOString(),
        })
        .eq("id", otpRecord.id);

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "This verification code has expired. Please request a new code.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Maximum of 3 attempts.
    if (otpRecord.attempts_used >= 3) {
      await supabaseAdmin
        .from("phone_verification_otps")
        .update({
          invalidated_at: new Date().toISOString(),
        })
        .eq("id", otpRecord.id);

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Too many attempts. Please request a new code.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify with Robase.
    const result = await robase.otp.verify({
      otp_id: otpId,
      code: String(code),
    });

    if (!result.valid) {
      const newAttempts = otpRecord.attempts_used + 1;

      await supabaseAdmin
        .from("phone_verification_otps")
        .update({
          attempts_used: newAttempts,
          invalidated_at:
            newAttempts >= 3
              ? new Date().toISOString()
              : null,
        })
        .eq("id", otpRecord.id);

      if (newAttempts >= 3) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            error: "Too many attempts. Please request a new code.",
          },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Incorrect verification code",
          attemptsRemaining: 3 - newAttempts,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Successfully verified.
    await supabaseAdmin
      .from("phone_verification_otps")
      .update({
        invalidated_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    const verificationToken = createPhoneVerificationToken(
      phone,
      otpId
    );

    return NextResponse.json(
      {
        success: true,
        verified: true,
        verificationToken,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("OTP verification error:", error);

    return NextResponse.json(
      {
        error: "Invalid or expired verification code",
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
}
