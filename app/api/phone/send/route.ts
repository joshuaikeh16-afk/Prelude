import { NextResponse } from "next/server";
import { Robase } from "@robasedev/sdk";
import { createClient } from "@supabase/supabase-js";

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
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Invalidate every previous OTP for this phone.
    await supabaseAdmin
      .from("phone_verification_otps")
      .update({
        invalidated_at: new Date().toISOString(),
      })
      .eq("phone", phone)
      .is("invalidated_at", null);

    const result = await robase.otp.send({
      phone_number: phone,
      code_length: 6,
      ttl_seconds: 600,
    });

    await supabaseAdmin
      .from("phone_verification_otps")
      .insert({
        phone,
        otp_id: result.id,
        attempts_used: 0,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    return NextResponse.json(
      {
        success: true,
        otpId: result.id,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("OTP send error:", error);

    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500, headers: corsHeaders }
    );
  }
}
