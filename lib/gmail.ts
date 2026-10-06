import { admin } from "@/lib/prelude-api";
import { googleTokens, seal, unseal } from "@/lib/mail-security";
import { detectMailEvents, validZone } from "@/lib/mail-events";
type Tokens = {accessToken: string; refreshToken: string; expiresAt: number};
type Part = {mimeType?: string; filename?: string; body?: {data?: string; attachmentId?: string; size?: number}; parts?: Part[]};
export type MailConnection = {id: string; user_id: string; tokens_ciphertext: string; email: string; auto_import: boolean; scan_cursor?: string | null; scan_after?: string | null; scan_window_end?: string | null; scan_lease_until?: string | null};
export async function gmailAccess(connection: MailConnection) {
  const tokens = unseal<Tokens>(connection.tokens_ciphertext);
  if (tokens.expiresAt > Date.now() + 60000) return tokens.accessToken;
  const next = await googleTokens({grant_type: "refresh_token", refresh_token: tokens.refreshToken});
  const updated = {accessToken: next.access_token, refreshToken: next.refresh_token || tokens.refreshToken, expiresAt: Date.now() + next.expires_in * 1000};
  const {error} = await admin().from("mail_connections").update({tokens_ciphertext: seal(updated)}).eq("id", connection.id).eq("user_id", connection.user_id);
  if (error) throw new Error("Could not refresh Gmail. Please reconnect.");
  return updated.accessToken;
}
async function gmail(path: string, accessToken: string, signal: AbortSignal) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {headers: {Authorization: `Bearer ${accessToken}`}, signal: AbortSignal.any([signal, AbortSignal.timeout(10000)])});
  if (response.status === 401 || response.status === 403) throw new Error("Please reconnect Gmail to allow email reading.");
  if (!response.ok) throw new Error("Gmail is unavailable. Please try again later.");
  return response.json();
}
export async function scanMailbox(connection: MailConnection, defaultZone: string) {
  const client = admin();
  const claim = await client.rpc("prelude_claim_mail_scan", {p_connection: connection.id});
  if (claim.error) throw new Error("Email scanning needs the background-scanning migration.");
  const leased = claim.data?.[0] as MailConnection | undefined;
  if (!leased) return {checked: 0, detected: 0, imported: 0, hasMore: false, busy: true, importFailures: 0};
  const signal = AbortSignal.timeout(45000);
  try { return await scan(leased, defaultZone, signal); }
  catch (error) {
    await client.from("mail_connections").update({last_scan_error: "Gmail needs attention. Try Check now or reconnect."})
      .eq("id", leased.id).eq("scan_lease_until", leased.scan_lease_until);
    throw error;
  } finally {
    await client.from("mail_connections").update({scan_lease_until: null}).eq("id", leased.id).eq("scan_lease_until", leased.scan_lease_until);
  }
}
async function scan(connection: MailConnection, defaultZone: string, signal: AbortSignal) {
  const accessToken = await gmailAccess(connection), client = admin();
  // Freeze a bounded search window across pages; advance the watermark only when complete.
  // A two-minute overlap plus the ID ledger handles boundary messages without re-reading bodies.
  const windowEnd = connection.scan_window_end || new Date().toISOString();
  const after = Math.max(Date.parse(windowEnd) - 30 * 86400000, (connection.scan_after ? Date.parse(connection.scan_after) : Date.parse(windowEnd) - 30 * 86400000) - 120000);
  const params = new URLSearchParams({q: `after:${Math.floor(after / 1000)} before:${Math.ceil(Date.parse(windowEnd) / 1000)} -in:spam -in:trash {filename:ics invitation meeting appointment reservation booking event}`, maxResults: "20"});
  if (connection.scan_cursor && connection.scan_window_end) params.set("pageToken", connection.scan_cursor);
  const window = await client.from("mail_connections").update({scan_window_end: windowEnd}).eq("id", connection.id).eq("scan_lease_until", connection.scan_lease_until);
  if (window.error) throw new Error("Could not save scan progress.");
  const listing = await gmail(`messages?${params}`, accessToken, signal);
  const messages: {id: string}[] = listing.messages || [];
  const processed = messages.length ? await client.from("mail_processed_messages").select("message_id").eq("connection_id", connection.id).in("message_id", messages.map(m => m.id)) : {data: [], error: null};
  if (processed.error) throw new Error("Could not load scan progress.");
  const seen = new Set((processed.data || []).map(row => row.message_id));
  const unread = messages.filter(message => !seen.has(message.id));
  let detected = 0, imported = 0, failed = 0, importFailures = 0;
  // Bounded parallel reads keep request time and Gmail API usage predictable.
  for (let index = 0; index < unread.length; index += 5) {
    const batch = await Promise.allSettled(unread.slice(index, index + 5).map(async ({id}) => {
      const message = await gmail(`messages/${encodeURIComponent(id)}?format=full`, accessToken, signal);
      const headers: {name: string; value: string}[] = message.payload?.headers || [];
      const header = (name: string) => headers.find(h => h.name.toLowerCase() === name)?.value || "";
      const calendars: string[] = [], plain: string[] = [], html: string[] = [];
      let partsRead = 0, decodedBytes = 0;
      async function read(part: Part, depth = 0) {
        signal.throwIfAborted();
        if (++partsRead > 64 || depth > 10 || decodedBytes > 1000000) return;
        const calendar = part.mimeType === "text/calendar" || /\.ics$/i.test(part.filename || "");
        if (calendar || part.mimeType === "text/plain" || part.mimeType === "text/html") {
          let data = part.body?.data;
          if (calendar && !data && part.body?.attachmentId && (part.body.size || 0) <= 250000)
            data = (await gmail(`messages/${encodeURIComponent(id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`, accessToken, signal)).data;
          if (data && data.length <= 400000) {
            const content = Buffer.from(data, "base64url").toString("utf8");
            decodedBytes += Buffer.byteLength(content);
            if (decodedBytes > 1000000) return;
            if (calendar) calendars.push(content);
            else if (part.mimeType === "text/plain") plain.push(content);
            else html.push(content.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " "));
          }
        }
        for (const child of part.parts || []) await read(child, depth + 1);
      }
      signal.throwIfAborted();
      await read(message.payload || {});
      const events = detectMailEvents(header("subject"), (plain.length ? plain : html).join("\n"), calendars, validZone(defaultZone) || "UTC");
      for (const event of events.slice(0, 20)) {
        signal.throwIfAborted();
        const result = await client.from("mail_event_suggestions").upsert({connection_id: connection.id, user_id: connection.user_id,
          source_key: event.key, source_subject: header("subject").slice(0, 500), source_sender: header("from").slice(0, 500),
          payload: event.payload, confidence: event.confidence}, {onConflict: "connection_id,source_key", ignoreDuplicates: true}).select("id");
        if (result.error) throw new Error("Could not save detected events.");
        detected += result.data?.length || 0;
      }
      const saved = await client.from("mail_processed_messages").upsert({connection_id: connection.id, message_id: id}, {onConflict: "connection_id,message_id"});
      if (saved.error) throw new Error("Could not save message progress.");
    }));
    failed += batch.filter(result => result.status === "rejected").length;
  }
  if (failed) throw new Error("Some emails could not be checked. Your saved suggestions are safe; try scanning again.");
  if (connection.auto_import) {
    const {data: pending, error} = await client.from("mail_event_suggestions").select("id,payload").eq("connection_id", connection.id).eq("user_id", connection.user_id).eq("status", "pending").eq("confidence", "clear").limit(50);
    if (error) throw new Error("Could not load detected events.");
    for (const suggestion of pending || []) {
      signal.throwIfAborted();
      const result = await client.rpc("prelude_import_mail_event", {p_suggestion: suggestion.id, p_payload: suggestion.payload});
      if (!result.error) imported++;
      else importFailures++;
    }
  }
  const {error} = await client.from("mail_connections").update({last_scan_at: new Date().toISOString(), last_scan_error: importFailures ? "Some invitations could not be added. Prelude will retry automatically." : null, scan_cursor: listing.nextPageToken || null, scan_window_end: listing.nextPageToken ? windowEnd : null, scan_after: listing.nextPageToken ? connection.scan_after : windowEnd}).eq("id", connection.id).eq("scan_lease_until", connection.scan_lease_until);
  if (error) throw new Error("Could not save scan progress.");
  await client.from("mail_processed_messages").delete().eq("connection_id", connection.id).lt("processed_at", new Date(Date.now() - 60 * 86400000).toISOString());
  return {checked: unread.length, detected, imported, hasMore: !!listing.nextPageToken, busy: false, importFailures};
}
