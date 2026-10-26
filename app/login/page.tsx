"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col items-center text-center rise">
        <div className="eyebrow flex items-center gap-1.5 mb-2">
          <Image src="/rixie-app-icon.png" alt="" width={30} height={30} className="rounded-[10px]" />
          <span>RIXIE</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Log in to Rixie
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Prepare for what&rsquo;s next.
        </p>
      </div>

      <div className="surface-card p-6 rounded-3xl rise-1">
        <form action={formAction} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_12px_var(--accent-glow)]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Password</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_12px_var(--accent-glow)]"
            />
          </label>

          {state?.error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-medium text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex items-center justify-center rounded-2xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-md shadow-[var(--accent-glow)] transition hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span>or</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <form action={async () => { await signInWithGoogle(); }}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-white/[0.04] py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white/[0.07] active:scale-98"
          >
            Continue with Google
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[var(--text-secondary)] rise-2">
        Don&rsquo;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[var(--accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
