export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-5 text-sm font-medium tracking-[0.3em] text-white/50">
          PRELUDE
        </p>

        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Prepare for what&apos;s next.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
          Plan your events, organize your tasks, set goals, and keep track
          of the moments that matter.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/register"
            className="rounded-full bg-white px-7 py-3 font-medium text-black transition hover:bg-white/80"
          >
            Get started
          </a>
          <a
            href="/login"
            className="rounded-full border border-white/20 px-7 py-3 font-medium transition hover:bg-white/10"
          >
            Sign in
          </a>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 px-6 py-7 text-sm text-white/50">
        <span>© {new Date().getFullYear()} Prelude</span>
        <a href="/privacy" className="underline underline-offset-4 hover:text-white">
          Privacy Policy
        </a>
        <a href="/terms" className="underline underline-offset-4 hover:text-white">
          Terms of Service
        </a>
        <a href="mailto:joshuaikeh16@gmail.com" className="hover:text-white">
          Contact
        </a>
      </footer>
    </main>
  );
}
