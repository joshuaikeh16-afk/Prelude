import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        }}
      />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="eyebrow rise mb-4 flex items-center gap-2">
          <Image src="/rixie-app-icon.png" alt="" width={30} height={30} className="rounded-[10px]" />
          <span>RIXIE</span>
        </div>

        <h1 className="rise-1 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--text-primary)]">
          Prepare for what&rsquo;s next.
        </h1>

        <p className="rise-2 mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
          Plan your moments, set your goals, organize tasks and savings, and relive
          every milestone as a lasting memory.
        </p>

        <div className="rise-3 mt-9 flex flex-wrap justify-center gap-3.5">
          <Link
            href="/register"
            className="press-on-tap inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 font-bold text-white shadow-lg shadow-[var(--accent-glow)] transition hover:brightness-110"
          >
            <span>Get started</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="press-on-tap inline-flex items-center rounded-full border border-[var(--line-strong)] bg-white/[0.04] px-7 py-3.5 font-semibold text-[var(--text-primary)] backdrop-blur-md transition hover:border-[var(--accent)] hover:bg-white/[0.08]"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-[var(--line)] px-6 py-6 text-xs text-[var(--text-muted)] backdrop-blur-md">
        <span>&copy; {new Date().getFullYear()} Rixie</span>
        <Link href="/privacy" className="transition hover:text-white">
          Privacy Policy
        </Link>
        <Link href="/terms" className="transition hover:text-white">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}
