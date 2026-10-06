"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithEmail, signInWithGoogle } from "@/app/actions/auth";

type ActionState = { error?: string } | null;

async function loginAction(_prevState: ActionState, formData: FormData) {
  const result = await signInWithEmail(formData);
  return result ?? null;
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    loginAction,
    null
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Log in to Prelude</h1>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="rounded-md border px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="rounded-md border px-3 py-2"
        />
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={async () => { await signInWithGoogle(); }}>
        <button
          type="submit"
          className="w-full rounded-md border px-3 py-2 font-medium"
        >
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        No account?{" "}
        <Link href="/register" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
