// Local/server scheduler adapter. The backend endpoint remains the only scanner.
import {existsSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.CRON_SECRET) throw new Error('Configure CRON_SECRET before starting the Gmail worker.');
const endpoint = new URL(process.env.MAIL_DISPATCH_URL || 'http://127.0.0.1:3000/api/mail/dispatch');
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname)))
  throw new Error('Use HTTPS or a loopback backend for Gmail dispatch.');
const stop = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop.abort());
do {
  try {
    const response = await fetch(endpoint, {method: 'POST', redirect: 'error',
      headers: {authorization: `Bearer ${process.env.CRON_SECRET}`},
      signal: AbortSignal.any([stop.signal, AbortSignal.timeout(65000)])});
    if (!response.ok) throw new Error(`Dispatch returned HTTP ${response.status}`);
    const result = await response.json();
    // Aggregate counters only; never print provider responses, credentials or mail.
    console.log(`Gmail dispatch: ${Number(result.checked) || 0} checked, ${Number(result.succeeded) || 0} succeeded, ${Number(result.failed) || 0} failed.`);
  } catch {
    if (!stop.signal.aborted) console.error('Gmail dispatch failed. Check backend configuration and scan status.');
    if (process.argv.includes('--once')) process.exitCode = 1;
  }
  if (process.argv.includes('--once') || stop.signal.aborted) break;
  await delay(15 * 60000, undefined, {signal: stop.signal}).catch(() => {});
} while (!stop.signal.aborted);
