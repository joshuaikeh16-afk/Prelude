-- Additive: preserve connections, suggestions, events and existing opt-outs.
alter table public.mail_connections add column if not exists scan_lease_until timestamptz;
alter table public.mail_connections add column if not exists scan_after timestamptz;
alter table public.mail_connections add column if not exists scan_window_end timestamptz;
create index if not exists mail_scan_due on public.mail_connections(last_scan_attempt_at);

-- IDs only. No email bodies, OAuth tokens or extracted private text in this ledger.
create table if not exists public.mail_processed_messages (
 connection_id uuid not null references public.mail_connections(id) on delete cascade,
 message_id text not null, processed_at timestamptz not null default now(),
 primary key(connection_id,message_id)
);
alter table public.mail_processed_messages enable row level security;
revoke all on public.mail_processed_messages from public,anon,authenticated;
grant all on public.mail_processed_messages to service_role;

create or replace function public.prelude_claim_mail_scan(p_connection uuid)
returns setof public.mail_connections language sql security definer set search_path=public,pg_temp as $$
 update public.mail_connections set scan_lease_until=now()+interval '3 minutes',last_scan_attempt_at=now()
 where id=p_connection and (scan_lease_until is null or scan_lease_until<now())
 returning *;
$$;
revoke all on function public.prelude_claim_mail_scan(uuid) from public,anon,authenticated;
grant execute on function public.prelude_claim_mail_scan(uuid) to service_role;

-- Reuse the existing durable reminder/push delivery pipeline. Dispatch respects
-- the user's notification preference; a unique key prevents duplicate alerts.
create or replace function public.prelude_mail_import_notice()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.role()='service_role' and new.status='imported' and old.status='pending' and new.event_id is not null then
  insert into public.reminders(event_id,title,remind_at,automatic_key)
  values(new.event_id,coalesce(new.payload->>'title','Event')||' added from Gmail',now(),'gmail-import')
  on conflict(event_id,automatic_key) where automatic_key is not null do nothing;
 end if;
 return new;
end $$;
revoke all on function public.prelude_mail_import_notice() from public,anon,authenticated;
drop trigger if exists mail_import_notice on public.mail_event_suggestions;
create trigger mail_import_notice after update of status on public.mail_event_suggestions
for each row execute function public.prelude_mail_import_notice();
