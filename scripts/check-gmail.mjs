import {createClient} from '@supabase/supabase-js';
import {existsSync} from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
let ready = true;
for (const key of ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI']) {
  const configured = Boolean(process.env[key]?.trim());
  console.log(`${key}: ${configured ? 'configured' : 'missing'}`);
  ready &&= configured;
}
const validKey = Buffer.from(process.env.MAIL_TOKEN_ENCRYPTION_KEY || '', 'base64').length === 32;
console.log(`Encryption key: ${validKey ? 'valid' : 'missing or invalid'}`);
ready &&= validKey;
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Supabase backend configuration is missing.');
  process.exit(1);
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth: {persistSession: false, autoRefreshToken: false}});
const checks = [
  ['mail_connections', 'id,email,auto_import,last_scan_at,last_scan_attempt_at,last_scan_error,scan_cursor,tokens_ciphertext,created_at,scan_after,scan_window_end,scan_lease_until'],
  ['mail_event_suggestions', 'id,confidence,payload,status,source_key,connection_id,user_id,event_id'],
  ['mail_oauth_states', 'state_hash,user_id,verifier_ciphertext,return_url,expires_at'],
  ['reminders', 'id,event_id,automatic_key'],
  ['mail_processed_messages', 'connection_id,message_id,processed_at'],
];
// GET with zero rows validates the actual schema without retrieving private data.
// A HEAD query can succeed without validating the requested table/columns.
const results = await Promise.allSettled(checks.map(([table, columns]) => client.from(table).select(columns).limit(0)));
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  const error = result.status === 'fulfilled' ? result.value.error : {code: 'CONNECTION_FAILED'};
  console.log(`${checks[i][0]}: ${error ? `not ready (${error.code})` : 'ready'}`);
  if (error) ready = false;
}
if (!ready) console.log('Apply supabase/migrations/20261005_email_import.sql and 20261006_mail_background_scanning.sql after the coherent-v1 migration, then run this check again.');
process.exitCode = ready ? 0 : 1;
