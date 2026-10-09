import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Prelude",
  description: "Learn how Prelude collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-white">
      <a href="/" className="text-sm text-white/60 hover:text-white">
        ← Back to Prelude
      </a>
      <p className="mt-10 text-sm text-white/50">Last updated: October 9, 2026</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-6 leading-7 text-white/70">
        Prelude helps you prepare for events by organizing schedules, tasks,
        goals, reminders, and related information. This policy explains how
        we handle your information when you use our service.
      </p>

      <section className="mt-10 space-y-8 leading-7 text-white/70">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>We may collect account details such as your email address, nickname,
          and profile picture, along with events, tasks, schedules, goals,
          reminders, and images you choose to provide.</p>
          <p className="mt-3">If you connect Google services, we access the information
          permitted by the permissions you grant and needed to provide the
          feature you request.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">2. How We Use Information</h2>
          <p>We use information to operate your account, provide planning tools,
          deliver reminders, maintain security, troubleshoot issues, and
          improve the service.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">3. Google and Gmail Access</h2>
          <p>If you authorize a Google integration, Prelude uses the access you
          grant to provide the requested functionality. For Gmail features,
          this may include processing email content and metadata to identify
          information relevant to event planning and generate suggestions.</p>
          <p className="mt-3">We do not use Google user data for targeted advertising
          or sell it. We do not use Google user data to train generalized
          AI or machine-learning models. We handle Google user data in
          accordance with applicable Google API policies and use it only
          for the purposes disclosed to you.</p>
          <p className="mt-3">You can revoke Google access through your Google Account
          security settings. Revoking access may disable related features.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">4. Storage and Sharing</h2>
          <p>We use service providers to operate Prelude, which may include
          database, hosting, authentication, and email delivery providers.
          Information may be processed by these providers as needed to
          deliver the service. We may also disclose information when required
          by law or necessary to protect users and the service.</p>
          <p className="mt-3">We take reasonable steps to protect information, but
          no method of online storage or transmission is completely secure.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">5. Retention and Deletion</h2>
          <p>We retain information for as long as needed to provide Prelude
          and meet legal or security obligations. You may request account
          and personal data deletion by contacting us. Some information
          may be retained where the law requires it.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">6. Your Choices</h2>
          <p>You can choose whether to connect optional integrations and can
          revoke Google permissions. You may contact us to ask about,
          correct, or request deletion of your personal information,
          subject to applicable law.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">7. Children and Changes</h2>
          <p>Prelude is not intended for children below the minimum age
          permitted under applicable law. We may update this policy and
          will publish the revised version on this page.</p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">8. Contact</h2>
          <p>For privacy questions or deletion requests, contact the Prelude
          team at joshuaikeh16@gmail.com.</p>
        </div>
      </section>

      <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-white/40">
        Prelude · Prepare for what’s next.
        <span className="mx-3">·</span>
        <a href="/terms" className="underline hover:text-white">Terms of Service</a>
      </footer>
    </main>
  );
}
