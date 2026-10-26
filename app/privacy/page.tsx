import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Rixie",
  description: "Learn how Rixie collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-[var(--text-primary)]">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white">
        <ArrowLeft size={16} />
        Back to Rixie
      </Link>
      <p className="mt-10 text-sm text-[var(--text-muted)]">Last updated: October 9, 2026</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-6 leading-7 text-[var(--text-secondary)]">
        Rixie helps you prepare for events by organizing schedules, tasks,
        goals, reminders, and related information. This policy explains how
        we handle your information when you use our service.
      </p>

      <section className="mt-10 space-y-8 leading-7 text-[var(--text-secondary)]">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">1. Information We Collect</h2>
          <p>We may collect account details such as your email address, nickname,
          and profile picture, along with events, tasks, schedules, goals,
          reminders, and images you choose to provide.</p>
          <p className="mt-3">If you sign in with Google, we use the account information
          needed to authenticate your account.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">2. How We Use Information</h2>
          <p>We use information to operate your account, provide planning tools,
          deliver reminders, maintain security, troubleshoot issues, and
          improve the service.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">3. Sign-in Providers</h2>
          <p>If you choose Google sign-in, Google provides the account information
          needed to authenticate you. You can manage third-party account access
          through your Google Account security settings.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">4. Storage and Sharing</h2>
          <p>We use service providers to operate Rixie, which may include
          database, hosting, authentication, and email delivery providers.
          Information may be processed by these providers as needed to
          deliver the service. We may also disclose information when required
          by law or necessary to protect users and the service.</p>
          <p className="mt-3">We take reasonable steps to protect information, but
          no method of online storage or transmission is completely secure.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">5. Retention and Deletion</h2>
          <p>We retain information for as long as needed to provide Rixie
          and meet legal or security obligations. You may request account
          and personal data deletion by contacting us. Some information
          may be retained where the law requires it.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">6. Your Choices</h2>
          <p>You can review and update your account preferences. You may contact us to ask about,
          correct, or request deletion of your personal information,
          subject to applicable law.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">7. Children and Changes</h2>
          <p>Rixie is not intended for children below the minimum age
          permitted under applicable law. We may update this policy and
          will publish the revised version on this page.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">8. Contact</h2>
          <p>For privacy questions or deletion requests, contact the Rixie
          team at joshuaikeh16@gmail.com.</p>
        </div>
      </section>

      <footer className="mt-16 border-t border-[var(--line)] pt-6 text-sm text-[var(--text-muted)]">
        Rixie · Prepare for what&rsquo;s next.
        <span className="mx-3">·</span>
        <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>
      </footer>
    </main>
  );
}
