import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Rixie",
  description: "Read the terms for using Rixie.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-[var(--text-primary)]">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white">
        <ArrowLeft size={16} />
        Back to Rixie
      </Link>
      <p className="mt-10 text-sm text-[var(--text-muted)]">Last updated: October 9, 2026</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-6 leading-7 text-[var(--text-secondary)]">
        These Terms govern your use of Rixie, an application for organizing
        events, tasks, goals, schedules, and reminders. By using Rixie,
        you agree to these Terms.
      </p>

      <section className="mt-10 space-y-8 leading-7 text-[var(--text-secondary)]">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">1. Using Rixie</h2>
          <p>Use Rixie lawfully and do not attempt to disrupt its operation,
          bypass security, access another user&apos;s account without permission,
          or use the service for unlawful purposes.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">2. Your Account</h2>
          <p>You are responsible for keeping your sign-in credentials secure
          and for activity under your account. Notify us if you suspect
          unauthorized access.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">3. Your Content</h2>
          <p>You remain responsible for the content you add to Rixie and
          must have the rights needed to use it. You permit Rixie to
          store and process that content only as reasonably necessary to
          operate the features you use, subject to our Privacy Policy.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">4. Third-Party Services</h2>
          <p>Rixie may offer integrations with services such as Google.
          These integrations may be subject to separate terms and privacy
          policies. You control whether to authorize optional integrations
          and may revoke access through the relevant provider.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">5. Reminders and Reliability</h2>
          <p>We aim to provide reliable scheduling and reminders but cannot
          guarantee uninterrupted service or delivery of every notification.
          Check important dates and arrangements independently when necessary.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">6. Changes and Availability</h2>
          <p>We may update, suspend, or discontinue features as reasonably
          necessary to maintain or improve Rixie. We will make reasonable
          efforts to communicate significant changes where appropriate.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">7. Disclaimer and Liability</h2>
          <p>Rixie is provided subject to applicable law and without a
          guarantee that it will always be available or error-free. To the
          extent permitted by law, we are not liable for indirect or
          consequential losses arising from use of the service. Nothing
          in these Terms excludes liability that cannot legally be excluded.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">8. Suspension or Termination</h2>
          <p>You may stop using Rixie at any time. We may restrict or
          terminate access when reasonably necessary for security, legal
          compliance, or serious violations of these Terms.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">9. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. The current version
          will be published on this page with its latest revision date.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">10. Contact</h2>
          <p>For questions about these Terms, contact the Rixie team at
          joshuaikeh16@gmail.com.</p>
        </div>
      </section>

      <footer className="mt-16 border-t border-[var(--line)] pt-6 text-sm text-[var(--text-muted)]">
        Rixie · Prepare for what&rsquo;s next.
        <span className="mx-3">·</span>
        <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>
      </footer>
    </main>
  );
}
