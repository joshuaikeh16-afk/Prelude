# Settings and Gmail refactor

Settings uses compact grouped rows for Account, Preferences, Connected apps, Security and Memories. Details expand on tap. Country, timezone and notification changes save immediately, with failure feedback/rollback. Profile editing retains one Save action. The creation-warning preference is removed from Settings without changing stored preferences. Recent memories still open inline; navigation and the separate create button retain their existing behavior. No Google Calendar integration or global visual redesign was added.

## Changed files

Frontend:
- `prelude-html/js/views/profile.js`: grouped Settings, autosave and secondary memory view.
- `prelude-html/js/email-import.js`: compact Gmail row, secondary management, review and import history.
- `prelude-html/css/prelude.css`: Settings-specific styles using existing tokens.
- `prelude-html/js/supabase.js`: persist Prelude sessions with Google provider credentials removed.
- `prelude-html/js/auth-session.js`: consume a transient Google grant during the OAuth callback.
- `prelude-html/js/gmail-permission.js`: clear transient provider credentials after backend handoff.

Backend:
- `backend/lib/mail-events.ts`: explicit English/ISO date variations, deterministic times and conservative confidence.
- `backend/lib/gmail.ts`: scan leases, frozen pagination windows, incremental watermark, processed-message ID ledger, bounded MIME parsing, safe retry and import failure reporting.
- `backend/app/api/mail/dispatch/route.ts`: authenticated GET/POST scheduler, 15-minute mailbox cadence and aggregate failure reporting.
- `backend/app/api/mail/suggestions/route.ts`: ownership-filtered recent imports with event links.
- `backend/supabase/migrations/20261006_mail_background_scanning.sql`: additive scan state, isolated ID ledger, service-only lease RPC and unique import notices in the existing notification pipeline.
- `backend/scripts/mail-worker.mjs`, `backend/scripts/check-gmail.mjs`, `backend/package.json`: local scheduler commands and schema diagnostics.
- `backend/EMAIL_IMPORT.md`: updated setup, scheduling and limitations.

Tests:
- `prelude-html/tests/mail-holidays.test.cjs`: parser variations and confidence/cancellation regressions.
- `prelude-html/tests/mail-scanning.test.cjs`: scanner, scheduling authorization, retry, refresh, ownership and disconnect/revocation mocks.
- `prelude-html/tests/gmail-storage.test.cjs`: no Google provider tokens persisted, with Prelude sessions preserved.
- `prelude-html/tests/auth-session.test.cjs`: transient grant callback handoff.
- `prelude-html/tests/migration.cjs`: additive migration replay, lease exclusivity/expiry, isolated ledger and unique import notice.
- `prelude-html/tests/browser-flow.cjs`: compact mobile Settings, immediate saving/rollback, permission failure, Gmail management and existing flows. Also corrects a duplicate mock signOut method that hid the deleted-session cleanup assertion.

## Database and deployment

Apply `20261006_mail_background_scanning.sql` after the existing coherent-v1 and Gmail migrations. Existing connection opt-outs, events, drafts and suggestions are preserved. The live schema check currently confirms the new columns/ledger are absent; this migration has not been applied remotely.

Local: start the backend and run `npm run mail:worker` in a separate backend terminal. The independent server-side worker calls `/api/mail/dispatch` immediately and every 15 minutes; it continues with the browser closed but must stay running. `npm run mail:dispatch` runs once. Both need `CRON_SECRET`.

Production: the existing `backend/vercel.json` schedules mail dispatch every 15 minutes and notification dispatch every minute. Deploy that configuration on a plan supporting both schedules and configure the production `CRON_SECRET`; alternatively schedule authenticated GET/POST calls externally. Configure the existing OAuth redirects, Gmail API, encrypted-token key, frontend origins and VAPID notification settings. Verify actual scheduler invocation logs and scan timestamps. No production scheduler was deployed here.

## Security and confidence

Gmail still uses only `gmail.readonly`. Client secrets and encrypted mailbox refresh tokens remain backend-only. OAuth state/PKCE, expected identity validation, refresh, ownership enforcement and best-effort revocation remain intact. Google provider tokens are stripped from browser persistence; the optional sign-in grant is transiently handed to the backend. The scanner never logs email bodies/tokens, executes email instructions, or fetches remote email links/images. Its ledger stores only Gmail message IDs and timestamps.

Valid one-off ICS invitations with timezone/UTC or all-day dates auto-import. A plain email qualifies only with one explicit full date/time, matching Date/Time labels, venue, explicit valid timezone, confirmation language and no uncertain/quoted context. The supplied Important Meeting / 9th of October example extracts 2026-10-09, 10:00 and Stadium but stays a suggestion because it lacks an explicit timezone. Ambiguous numeric/relative dates are not guessed.

## Validation and limitations

Unit tests, isolated PGlite database tests, TypeScript checks and targeted backend ESLint pass. Mobile/desktop browser fixtures pass 30 flow checks, including authentication routing, optional Gmail grant handoff, review, disconnect, Settings autosave and rollback. The production build passes with `npm run build -- --webpack`; default Turbopack hits a sandbox port-binding error. Full-project lint still reports pre-existing issues in unrelated legacy event pages/actions.

Provider calls are mocked in tests: real Google consent, mailbox delivery, refresh/revocation and push delivery still require end-to-end testing with the configured OAuth application, a test mailbox and deployed/running schedulers. Polling is not instant push: each dispatch scans up to three due mailboxes and each scan handles up to 20 candidates. More accounts or large backlogs increase latency; a higher-frequency scheduler or durable queue is needed at higher volumes. Recurring/cancelled calendar invitations are skipped; existing events are not automatically rescheduled or cancelled. Unsupported/ambiguous emails remain suggestions or produce no extraction.
