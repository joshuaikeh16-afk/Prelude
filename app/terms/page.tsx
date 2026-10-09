import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Prelude",
  description: "Read the terms for using Prelude.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-white">
      <a href="/" className="text-sm text-white/60 hover:text-white">
        ← Back to Prelude
      </a>
      <p className="mt-10 text-sm text-white/50">Last updated: October 9, 2026</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-6 leading-7 text-white/70">
        These Terms govern your use of Prelude, an application for organizing
        events, tasks, goals, schedules, and reminders. By using Prelude,
        you agree to these Terms.
      </p>

      <section className="mt-10 space-y-8 leading-7 text-white/70">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">1. Using Prelude</h2>
          <p>Use Prelude lawfully and do not attempt to disrupt its operation,
          bypass security, access another user's account without permission,
          or use the service for unlawful purposes.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">2. Your Account</h2>
          <p>You are responsible for keeping your sign-in credentials secure
          and for activity under your account. Notify us if you suspect
          unauthorized access.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">3. Your Content</h2>
          <p>You remain responsible for the content you add to Prelude and
          must have the rights needed to use it. You permit Prelude to
          store and process that content only as reasonably necessary to
          operate the features you use, subject to our Privacy Policy.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">4. Third-Party Services</h2>
          <p>Prelude may offer integrations with services such as Google.
          These integrations may be subject to separate terms and privacy
          policies. You control whether to authorize optional integrations
          and may revoke access through the relevant provider.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">5. Reminders and Reliability</h2>
          <p>We aim to provide reliable scheduling and reminders but cannot
          guarantee uninterrupted service or delivery of every notification.
          Check important dates and arrangements independently when necessary.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">6. Changes and Availability</h2>
          <p>We may update, suspend, or discontinue features as reasonably
          necessary to maintain or improve Prelude. We will make reasonable
          efforts to communicate significant changes where appropriate.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">7. Disclaimer and Liability</h2>
          <p>Prelude is provided subject to applicable law and without a
          guarantee that it will always be available or error-free. To the
          extent permitted by law, we are not liable for indirect or
          consequential losses arising from use of the service. Nothing
          in these Terms excludes liability that cannot legally be excluded.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">8. Suspension or Termination</h2>
          <p>You may stop using Prelude at any time. We may restrict or
          terminate access when reasonably necessary for security, legal
          compliance, or serious violations of these Terms.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">9. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. The current version
          will be published on this page with its latest revision date.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">10. Contact</h2>
          <p>For questions about these Terms, contact the Prelude team at
          joshuaikeh16@gmail.com.</p>
        </div>
      </section>

      <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-white/40">
        Prelude · Prepare for what’s next.
        <span className="mx-3">·</span>
        <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
      </footer>
    </main>
  );
}
