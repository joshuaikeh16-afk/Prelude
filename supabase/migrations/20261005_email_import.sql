-- Mail credentials are only accessible to the backend service role.
create table if not exists public.mail_oauth_states (
 state_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 verifier_ciphertext text not null, return_url text not null, expires_at timestamptz not null
);
create table if not exists public.mail_connections (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null default 'gmail' check(provider='gmail'), email text not null,
 tokens_ciphertext text not null, last_scan_at timestamptz, last_scan_attempt_at timestamptz, last_scan_error text, auto_import boolean not null default true, scan_cursor text,
 created_at timestamptz not null default now(), unique(user_id,provider,email)
);
create table if not exists public.mail_event_suggestions (
 id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.mail_connections(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, source_key text not null,
 source_subject text not null, source_sender text not null, payload jsonb not null,
 status text not null default 'pending' check(status in('pending','dismissed','imported')),
 confidence text not null default 'review' check(confidence in('clear','review')),
 event_id uuid references public.events(id) on delete set null, created_at timestamptz not null default now(),
 unique(connection_id,source_key), check(pg_column_size(payload)<20000)
);
alter table public.mail_oauth_states enable row level security;
alter table public.mail_connections enable row level security;
alter table public.mail_event_suggestions enable row level security;
revoke all on public.mail_oauth_states, public.mail_connections, public.mail_event_suggestions from public,anon,authenticated;
grant all on public.mail_oauth_states, public.mail_connections, public.mail_event_suggestions to service_role;
create index if not exists mail_pending_user on public.mail_event_suggestions(user_id,status);

-- Import atomically and idempotently, without consuming the user's manual event draft.
create or replace function public.prelude_import_mail_event(p_suggestion uuid,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); s public.mail_event_suggestions; e uuid; event_title text; event_date date; event_time time; zone text; starts timestamptz;
begin
 if owner_id is null and auth.role()='service_role' then
  select s0.user_id into owner_id from public.mail_event_suggestions s0 join public.mail_connections c on c.id=s0.connection_id
  where s0.id=p_suggestion and s0.confidence='clear' and c.auto_import and s0.payload=p_payload and c.user_id=s0.user_id;
 end if;
 if owner_id is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,2));
 select * into s from public.mail_event_suggestions where id=p_suggestion and user_id=owner_id for update;
 if s.id is null then raise exception 'Email suggestion unavailable';end if;
 if s.status='imported' and s.event_id is not null then return s.event_id;end if;
 if s.status<>'pending' then raise exception 'Email suggestion unavailable';end if;
 if pg_column_size(p_payload)>20000 then raise exception 'Event details are too large';end if;
 event_title:=trim(p_payload->>'title');event_date:=(p_payload->>'date')::date;
 event_time:=nullif(p_payload->>'time','')::time;zone:=p_payload->>'timezone';
 if char_length(event_title) not between 1 and 120 or event_title is null or event_date is null or zone is null then raise exception 'Invalid event details';end if;
 if char_length(coalesce(p_payload->>'location',''))>500 or char_length(coalesce(p_payload->>'description',''))>2000 then raise exception 'Event details are too long';end if;
 if event_date<(now() at time zone zone)::date then raise exception 'Choose today or a future date';end if;
 select id into e from public.events where user_id=owner_id and lower(trim(title))=lower(event_title)
 and date=event_date and time is not distinct from event_time and timezone=zone limit 1;
 if e is null then
  insert into public.events(user_id,title,date,time,timezone,location,description)
  values(owner_id,event_title,event_date,event_time,zone,nullif(p_payload->>'location',''),nullif(p_payload->>'description','')) returning id into e;
  starts:=(event_date+coalesce(event_time,time '09:00')) at time zone zone;
  insert into public.reminders(event_id,title,remind_at,automatic_key)
  select e,label,at_time,key from (values('Tomorrow: '||event_title,starts-interval '24 hours','before'),('Starting: '||event_title,starts,'start')) as v(label,at_time,key) where at_time>now();
 end if;
 update public.mail_event_suggestions set status='imported',event_id=e where id=s.id;
 return e;
end $$;
revoke all on function public.prelude_import_mail_event(uuid,jsonb) from public,anon;
grant execute on function public.prelude_import_mail_event(uuid,jsonb) to authenticated,service_role;
