import {
  admin,
  cors,
  email,
  failure,
  options,
  reply,
  tokenHash,
} from "@/lib/prelude-api";
export const OPTIONS = options;
export async function POST(request: Request) {
  try {
    cors(request);
    const input = await request.json();
    const address = email(input.email);
    if (
      typeof input.password !== "string" ||
      input.password.length < 8 ||
      input.password.length > 128 ||
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.length > 80 ||
      typeof input.nickname !== "string" ||
      !input.nickname.trim() ||
      input.nickname.length > 40 ||
      typeof input.verificationToken !== "string" ||
      !/^[\w-]{43}$/.test(input.verificationToken)
    )
      return failure(
        request,
        "Complete your profile and verify your email before creating an account.",
      );
    const client = admin();
    const { data: verified, error: proofError } = await client.rpc(
      "prelude_consume_proof",
      { p_email: address, p_proof: tokenHash(input.verificationToken) },
    );
    if (proofError || !verified)
      return failure(
        request,
        "Your verification has expired. Please verify your email again.",
      );
    const { data, error } = await client.auth.admin.createUser({
      email: address,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name.trim(),
        nickname: input.nickname.trim(),
        full_name: input.name.trim(),
        display_name: input.nickname.trim(),
        prelude_profile: {
          name: input.name.trim(),
          nickname: input.nickname.trim(),
          complete: true,
          walkthrough_completed: false,
          preferences: { holidayCountry: "NG", notifications: false },
        },
      },
    });
    if (error)
      return failure(
        request,
        "We couldn't create this account. Try signing in if you already have one, or verify your email again.",
      );
    const profile = await client
      .from("profiles")
      .upsert({ id: data.user.id, display_name: input.nickname.trim() });
    return reply(request, {
      success: true,
      profilePending: Boolean(profile.error),
    });
  } catch {
    return failure(request, "Unable to create your account. Please try again.");
  }
}
