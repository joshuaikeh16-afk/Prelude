-- Additive V1 migration, based on the deployed Prelude schema.
begin;
alter table public.events add column if not exists preparation_deadline timestamptz;
alter table public.events add column if not exists completed_at timestamptz;
alter table public.events add column if not exists location_lat double precision check(location_lat between -90 and 90);
alter table public.events add column if not exists location_lon double precision check(location_lon between -180 and 180);
alter table public.events add column if not exists location_place_id text;
alter table public.events add column if not exists reflection text not null default '';
update public.events set preparation_deadline=(date+coalesce(time,time '09:00')) at time zone timezone where preparation_deadline is null;
alter table public.tasks add column if not exists goal_id uuid references public.goals(id) on delete cascade;
alter table public.tasks add column if not exists duration_minutes integer check(duration_minutes between 1 and 1440);
create index if not exists tasks_goal_idx on public.tasks(goal_id);
create index if not exists events_owner_date_idx on public.events(user_id,date);
create table if not exists public.event_drafts(user_id uuid primary key references auth.users(id) on delete cascade,payload jsonb not null default '{}',updated_at timestamptz not null default now());
create table if not exists public.event_memory_photos(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id) on delete cascade,storage_path text not null,created_at timestamptz not null default now());
create table if not exists public.task_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,event_id uuid not null references public.events(id) on delete cascade,task_id uuid not null references public.tasks(id) on delete cascade,state text not null check(state in('running','paused','stopped','expired','completed')),remaining_seconds integer not null check(remaining_seconds>=0),deadline timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),notified_at timestamptz,alert_claimed_at timestamptz,alert_attempts integer not null default 0);
create table if not exists public.event_reflections(event_id uuid primary key references public.events(id) on delete cascade,content text not null default '' check(char_length(content)<=10000),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index if not exists one_active_timer on public.task_sessions(user_id) where state in('running','paused');
create index if not exists sessions_task_idx on public.task_sessions(task_id);
alter table public.reminders add column if not exists automatic_key text;
alter table public.reminders add column if not exists attempts integer not null default 0;
alter table public.reminders add column if not exists claimed_at timestamptz;
create unique index if not exists reminders_automatic_unique on public.reminders(event_id,automatic_key) where automatic_key is not null;
create index if not exists reminders_dispatch_idx on public.reminders(remind_at) where sent_at is null;

create or replace function public.prelude_event_rules() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' then
  if new.date < (now() at time zone new.timezone)::date then raise exception 'Choose today or a future date'; end if;
  if new.title is null or new.date is null or new.timezone is null or char_length(trim(new.title)) not between 1 and 120 then raise exception 'Invalid event name';end if;
  if new.status<>'upcoming' then raise exception 'New events must be upcoming';end if;
  new.preparation_deadline := (new.date+coalesce(new.time,time '09:00')) at time zone new.timezone;
  if new.date=(now() at time zone new.timezone)::date and new.preparation_deadline<=now() then new.preparation_deadline := (new.date+1)::timestamp at time zone new.timezone;end if;
 else
  if new.user_id is distinct from old.user_id or new.title is distinct from old.title or new.date is distinct from old.date or new.timezone is distinct from old.timezone then raise exception 'Event identity is fixed';end if;
  if new.status not in('upcoming','past') then raise exception 'Invalid status';end if;
  if old.status='past' then
   if current_setting('prelude.unlink_source',true)='1' and new.source_event_id is null then
    if (to_jsonb(new)-array['source_event_id','updated_at']) is distinct from (to_jsonb(old)-array['source_event_id','updated_at']) then raise exception 'Preparation history is read only';end if;
   elsif (to_jsonb(new)-array['reflection','updated_at']) is distinct from (to_jsonb(old)-array['reflection','updated_at']) then raise exception 'Preparation history is read only';end if;
  end if;
  if new.time is distinct from old.time then
   if now()>=old.preparation_deadline then raise exception 'The preparation deadline has passed';end if;
   if old.preparation_deadline=(old.date+1)::timestamp at time zone old.timezone then new.preparation_deadline:=old.preparation_deadline;
   else new.preparation_deadline := (new.date+coalesce(new.time,time '09:00')) at time zone new.timezone;end if;
  elsif new.preparation_deadline is distinct from old.preparation_deadline then raise exception 'Deadline cannot be changed directly';end if;
  if new.status='past' and old.status<>'past' then
   if (now() at time zone new.timezone)::date<new.date then raise exception 'Complete this event on its event day';end if;
   new.completed_at:=now();
  elsif new.completed_at is distinct from old.completed_at then raise exception 'Completion time cannot be changed directly';end if;
 end if;
 if new.source_event_id is not null and (tg_op='INSERT' or new.source_event_id is distinct from old.source_event_id) then
  if not exists(select 1 from public.events where id=new.source_event_id and user_id=new.user_id and status='past') then raise exception 'Source event unavailable';end if;
 end if;
 if new.image_path is not null and new.image_path not like new.user_id::text||'/%' then raise exception 'Invalid image path';end if;
 if char_length(new.reflection)>10000 then raise exception 'Reflection is too long';end if;
 new.updated_at:=now();return new;
end $$;
drop trigger if exists prelude_event_rules on public.events;
create trigger prelude_event_rules before insert or update on public.events for each row execute function public.prelude_event_rules();

create or replace function public.prelude_child_rules() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare e public.events; parent_id uuid;
begin
 if tg_op='DELETE' then parent_id:=old.event_id;else parent_id:=new.event_id;end if;
 select * into e from public.events where id=parent_id;
 -- Cascaded event deletion is allowed after the parent has disappeared.
 if not found and tg_op='DELETE' then return old;end if;
 if not found then raise exception 'Event unavailable';end if;
 if tg_table_name='reminders' and tg_op='UPDATE' then
  if (to_jsonb(new)-array['status','sent_at','attempts','claimed_at'])=(to_jsonb(old)-array['status','sent_at','attempts','claimed_at']) then return new;end if;
 end if;
 if tg_op='UPDATE' and new.event_id is distinct from old.event_id then raise exception 'Cannot move preparation between events';end if;
 if tg_table_name in('event_memory_photos','event_reflections') then
  if e.status<>'past' then raise exception 'Add memories after completing the event';end if;
  if tg_table_name='event_memory_photos' and tg_op<>'DELETE' then
   if new.storage_path not like e.user_id::text||'/%' then raise exception 'Invalid photo path';end if;
  end if;
 else
  if e.status='past' then raise exception 'Preparation history is read only';end if;
  if tg_table_name in('tasks','goals') and now()>=e.preparation_deadline then raise exception 'The preparation deadline has passed';end if;
  if tg_table_name='tasks' and tg_op<>'DELETE' then
   new.due_date:=null;
   if new.title is null or char_length(trim(new.title)) not between 1 and 300 then raise exception 'Invalid task';end if;
   if new.goal_id is not null and not exists(select 1 from public.goals where id=new.goal_id and event_id=e.id) then raise exception 'Goal belongs to another event';end if;
  elsif tg_table_name='goals' and tg_op<>'DELETE' then
   if new.content is null or char_length(trim(new.content)) not between 1 and 300 then raise exception 'Invalid goal';end if;
  elsif tg_table_name='schedule_items' and tg_op<>'DELETE' then
   if (new.start_time at time zone e.timezone)::date>e.date then raise exception 'Schedule cannot fall after the event';end if;
   if new.title is null or new.start_time is null or char_length(trim(new.title)) not between 1 and 200 then raise exception 'Invalid schedule title';end if;
  elsif tg_table_name='notes' and tg_op<>'DELETE' then
   if char_length(new.content)>10000 then raise exception 'Note is too long';end if;new.updated_at:=now();
  elsif tg_table_name='reminders' and tg_op<>'DELETE' then
   if new.task_id is not null and not exists(select 1 from public.tasks where id=new.task_id and event_id=e.id) then raise exception 'Task belongs to another event';end if;
  end if;
 end if;
 if tg_op='DELETE' then return old;else return new;end if;
end $$;

do $$declare t text; p record;begin
 foreach t in array array['events','profiles','tasks','goals','notes','schedule_items','reminders','push_subscriptions','event_drafts','event_memory_photos','event_reflections','task_sessions'] loop
  execute format('alter table public.%I enable row level security',t);
  -- Replace existing V1 policies: permissive policies otherwise combine with OR.
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t);end loop;
  execute format('revoke all on public.%I from anon',t);
  if t in('events','profiles','event_drafts','push_subscriptions') then
   execute format('create policy owner_all on public.%I for all to authenticated using(%I=auth.uid()) with check(%I=auth.uid())',t,case when t='profiles' then 'id' else 'user_id' end,case when t='profiles' then 'id' else 'user_id' end);
  elsif t='task_sessions' then
   execute 'create policy session_read on public.task_sessions for select to authenticated using(user_id=auth.uid())';
  else
   execute format('create policy owner_all on public.%I for all to authenticated using(exists(select 1 from public.events e where e.id=%I.event_id and e.user_id=auth.uid())) with check(exists(select 1 from public.events e where e.id=%I.event_id and e.user_id=auth.uid()))',t,t,t);
   execute format('drop trigger if exists prelude_child_rules on public.%I',t);
   execute format('create trigger prelude_child_rules before insert or update or delete on public.%I for each row execute function public.prelude_child_rules()',t);
  end if;
  execute format('grant all on public.%I to service_role',t);
  if t='task_sessions' then execute 'revoke all on public.task_sessions from authenticated';execute 'grant select on public.task_sessions to authenticated';
  else execute format('grant select,insert,update,delete on public.%I to authenticated',t);end if;
 end loop;
end $$;

create or replace function public.prelude_finish_task_timer() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.completed then update public.task_sessions set state='completed',remaining_seconds=0,deadline=null,updated_at=now() where task_id=new.id and state in('running','paused','stopped','expired');end if;return new;
end $$;
drop trigger if exists prelude_finish_task_timer on public.tasks;
create trigger prelude_finish_task_timer after update on public.tasks for each row execute function public.prelude_finish_task_timer();

create or replace function public.prelude_sync_events() returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null and auth.role()<>'service_role' then raise exception 'Authentication required';end if;
 update public.events set status='past' where status='upcoming' and now()>=(date+2)::timestamp at time zone timezone and (user_id=auth.uid() or auth.role()='service_role');
 update public.task_sessions s set state='expired',remaining_seconds=0,updated_at=now() from public.tasks t join public.events e on e.id=t.event_id
 where s.task_id=t.id and s.state in('running','paused') and (s.user_id=auth.uid() or auth.role()='service_role') and (e.status='past' or now()>=e.preparation_deadline or (s.state='running' and s.deadline<=now()));
end $$;
revoke all on function public.prelude_sync_events() from public,anon;
grant execute on function public.prelude_sync_events() to authenticated,service_role;

create or replace function public.prelude_create_event(p_payload jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare new_event_id uuid;new_goal_id uuid;g jsonb;t jsonb;n jsonb;s jsonb;start_at timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,2));
 if pg_column_size(p_payload)>200000 then raise exception 'Draft is too large';end if;
 insert into public.events(user_id,title,date,time,timezone,location,location_lat,location_lon,location_place_id,image_path,is_priority,description)
 values(auth.uid(),trim(p_payload->>'title'),(p_payload->>'date')::date,nullif(p_payload->>'time','')::time,p_payload->>'timezone',nullif(p_payload->'location'->>'label',''),(p_payload->'location'->>'lat')::double precision,(p_payload->'location'->>'lon')::double precision,p_payload->'location'->>'id',nullif(p_payload->>'image_path',''),coalesce((p_payload->>'is_priority')::boolean,false),nullif(p_payload->>'description','')) returning id into new_event_id;
 if nullif(p_payload->>'source_event_id','') is not null then
  if not exists(select 1 from public.events where id=(p_payload->>'source_event_id')::uuid and user_id=auth.uid() and status='past') then raise exception 'Source event unavailable';end if;
  update public.events set source_event_id=(p_payload->>'source_event_id')::uuid where id=new_event_id;
 end if;
 for g in select * from jsonb_array_elements(coalesce(p_payload->'goals','[]')) loop
  insert into public.goals(event_id,content) values(new_event_id,g->>'title') returning id into new_goal_id;
  for t in select * from jsonb_array_elements(coalesce(g->'tasks','[]')) loop insert into public.tasks(event_id,goal_id,title,duration_minutes) values(new_event_id,new_goal_id,t->>'title',nullif(t->>'duration_minutes','')::integer);end loop;
 end loop;
 for t in select * from jsonb_array_elements(coalesce(p_payload->'tasks','[]')) loop insert into public.tasks(event_id,title,duration_minutes) values(new_event_id,t->>'title',nullif(t->>'duration_minutes','')::integer);end loop;
 for n in select * from jsonb_array_elements(coalesce(p_payload->'notes','[]')) loop insert into public.notes(event_id,content) values(new_event_id,n->>'content');end loop;
 for s in select * from jsonb_array_elements(coalesce(p_payload->'schedule','[]')) loop insert into public.schedule_items(event_id,title,start_time) values(new_event_id,s->>'title',(s->>'start_time')::timestamptz);end loop;
 select (date+coalesce(time,time '09:00')) at time zone timezone into start_at from public.events where id=new_event_id;
 insert into public.reminders(event_id,title,remind_at,automatic_key)
 select new_event_id,label,at_time,key from (values('Tomorrow: '||(p_payload->>'title'),start_at-interval '24 hours','before'),('Starting: '||(p_payload->>'title'),start_at,'start')) as v(label,at_time,key) where at_time>now();
 delete from public.event_drafts where user_id=auth.uid();
 return new_event_id;
end $$;
revoke all on function public.prelude_create_event(jsonb) from public,anon;
grant execute on function public.prelude_create_event(jsonb) to authenticated;

-- Private server-only OTP/proof storage. Atomic issuance and verification.
alter table public.email_verification_otps enable row level security;
alter table public.phone_verification_otps enable row level security;
revoke all on public.email_verification_otps,public.phone_verification_otps from anon,authenticated;
create table if not exists public.signup_proofs(token_hash text primary key,email text not null,expires_at timestamptz not null,consumed_at timestamptz);
alter table public.signup_proofs enable row level security;
revoke all on public.signup_proofs from anon,authenticated;
create or replace function public.prelude_issue_otp(p_email text,p_hash text,p_production boolean) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare id uuid;begin
 perform pg_advisory_xact_lock(hashtextextended(p_email,1));
 if p_production and ((select count(*) from public.email_verification_otps where email=p_email and created_at>now()-interval '1 hour')>=5 or exists(select 1 from public.email_verification_otps where email=p_email and created_at>now()-interval '60 seconds')) then raise exception 'Please wait before requesting another code';end if;
 update public.email_verification_otps set invalidated_at=now() where email=p_email and invalidated_at is null;
 insert into public.email_verification_otps(email,otp_code_hash,expires_at) values(p_email,p_hash,now()+interval '10 minutes') returning email_verification_otps.id into id;return id;
end $$;
create or replace function public.prelude_verify_otp(p_email text,p_hash text,p_proof text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$declare r public.email_verification_otps;begin
 perform pg_advisory_xact_lock(hashtextextended(p_email,1));
 select * into r from public.email_verification_otps where email=p_email and invalidated_at is null order by created_at desc limit 1 for update;
 if r.id is null then return false;end if;
 if r.expires_at<=now() or r.attempts_used>=3 then update public.email_verification_otps set invalidated_at=now() where id=r.id;return false;end if;
 if r.otp_code_hash<>p_hash then update public.email_verification_otps set attempts_used=attempts_used+1,invalidated_at=case when attempts_used+1>=3 then now() else null end where id=r.id;return false;end if;
 update public.email_verification_otps set invalidated_at=now() where id=r.id;
 insert into public.signup_proofs values(p_proof,p_email,now()+interval '15 minutes',null);return true;
end $$;
create or replace function public.prelude_consume_proof(p_email text,p_proof text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$declare found_hash text;begin
 update public.signup_proofs set consumed_at=now() where token_hash=p_proof and email=p_email and expires_at>now() and consumed_at is null returning token_hash into found_hash;return found_hash is not null;
end $$;
revoke all on function public.prelude_issue_otp(text,text,boolean),public.prelude_verify_otp(text,text,text),public.prelude_consume_proof(text,text) from public,anon,authenticated;
grant execute on function public.prelude_issue_otp(text,text,boolean),public.prelude_verify_otp(text,text,text),public.prelude_consume_proof(text,text) to service_role;

-- Private image buckets; only the owning user's folder is accessible.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('event-images','event-images',false,8388608,array['image/jpeg','image/png','image/webp']),
 ('memory-photos','memory-photos',false,8388608,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',false,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false;
drop policy if exists prelude_media_owner on storage.objects;
create policy prelude_media_owner on storage.objects for all to authenticated using(bucket_id in('event-images','memory-photos','avatars') and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id in('event-images','memory-photos','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
-- Lifecycle and timers are server authoritative; clocks in the UI only display them.
create or replace function public.prelude_complete_event(p_event_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 update public.events set status='past' where id=p_event_id and user_id=auth.uid() and status='upcoming' and date<=(now() at time zone timezone)::date;
 if not found then raise exception 'Event cannot be completed yet';end if;
 update public.task_sessions set state='stopped',remaining_seconds=case when state='running' then greatest(0,ceil(extract(epoch from deadline-now()))::integer) else remaining_seconds end,deadline=null where event_id=p_event_id and state in('running','paused');
 update public.reminders set status='cancelled' where event_id=p_event_id and sent_at is null;
end $$;
create or replace function public.prelude_delete_event(p_event_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform set_config('prelude.unlink_source','1',true);
 update public.events set source_event_id=null where source_event_id=p_event_id and user_id=auth.uid();
 delete from public.events where id=p_event_id and user_id=auth.uid();if not found then raise exception 'Event unavailable';end if;
end $$;
revoke all on function public.prelude_complete_event(uuid),public.prelude_delete_event(uuid) from public,anon;
grant execute on function public.prelude_complete_event(uuid),public.prelude_delete_event(uuid) to authenticated;

create or replace function public.prelude_timer(p_task_id uuid,p_action text,p_seconds integer default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.tasks;e public.events;s public.task_sessions;seconds integer;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));perform public.prelude_sync_events();
 select * into t from public.tasks where id=p_task_id;select * into e from public.events where id=t.event_id and user_id=auth.uid() for update;
 if e.id is null or t.completed or now()>=e.preparation_deadline or e.status='past' then raise exception 'Task unavailable or deadline passed';end if;
 select * into s from public.task_sessions where task_id=t.id and user_id=auth.uid() order by created_at desc limit 1 for update;
 if p_action='complete' then update public.tasks set completed=true where id=t.id;select * into s from public.task_sessions where id=s.id;return to_jsonb(s);
 elsif p_action in('start','resume','extend') then
  if exists(select 1 from public.task_sessions where user_id=auth.uid() and state in('running','paused') and task_id<>t.id) then raise exception 'Finish or stop your current timer first';end if;
  if p_action='extend' then
   if p_seconds is null or p_seconds not between 60 and 86400 then raise exception 'Invalid extension';end if;
   seconds:=case when s.state='running' then greatest(0,ceil(extract(epoch from s.deadline-now()))::integer) else coalesce(s.remaining_seconds,0) end+p_seconds;
  else
   seconds:=coalesce(s.remaining_seconds,t.duration_minutes*60);
   if s.state='running' then return to_jsonb(s);end if;
   if s.state='expired' or seconds is null or seconds<1 then raise exception 'Set a duration or extend this timer';end if;
  end if;
  if seconds>86400 then raise exception 'Timer cannot exceed 24 hours';end if;
  seconds:=least(seconds,greatest(0,ceil(extract(epoch from e.preparation_deadline-now()))::integer));
  if s.id is null then insert into public.task_sessions(user_id,event_id,task_id,state,remaining_seconds,deadline) values(auth.uid(),e.id,t.id,'running',seconds,least(now()+make_interval(secs=>seconds),e.preparation_deadline)) returning * into s;
  else update public.task_sessions set state='running',remaining_seconds=seconds,deadline=least(now()+make_interval(secs=>seconds),e.preparation_deadline),notified_at=null,alert_claimed_at=null,alert_attempts=0,updated_at=now() where id=s.id returning * into s;end if;
 elsif p_action in('pause','stop') then
  if s.id is null or s.state not in('running','paused','expired') then raise exception 'No active timer';end if;
  seconds:=case when s.state='running' then greatest(0,ceil(extract(epoch from s.deadline-now()))::integer) else s.remaining_seconds end;
  update public.task_sessions set state=case when p_action='pause' then 'paused' else 'stopped' end,remaining_seconds=seconds,deadline=null,updated_at=now() where id=s.id returning * into s;
 else raise exception 'Unknown timer action';end if;
 return to_jsonb(s);
end $$;
create or replace function public.prelude_task_timer(p_task_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare result jsonb;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;perform public.prelude_sync_events();
 select to_jsonb(s)||jsonb_build_object('task_title',t.title) into result from public.task_sessions s join public.tasks t on t.id=s.task_id where s.task_id=p_task_id and s.user_id=auth.uid() order by s.created_at desc limit 1;return result;
end $$;
create or replace function public.prelude_get_timer() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare result jsonb;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;perform public.prelude_sync_events();
 select to_jsonb(s)||jsonb_build_object('task_title',t.title) into result from public.task_sessions s join public.tasks t on t.id=s.task_id join public.events e on e.id=s.event_id where s.user_id=auth.uid() and s.state in('running','paused','expired') and e.status='upcoming' order by case when s.state in('running','paused') then 0 else 1 end,s.updated_at desc limit 1;return result;
end $$;
revoke all on function public.prelude_timer(uuid,text,integer),public.prelude_task_timer(uuid),public.prelude_get_timer() from public,anon;
grant execute on function public.prelude_timer(uuid,text,integer),public.prelude_task_timer(uuid),public.prelude_get_timer() to authenticated;

-- Reschedule automatic reminders when the start time changes.
create or replace function public.prelude_reschedule() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$declare starts timestamptz;begin
 if new.time is distinct from old.time and new.status='upcoming' then
  starts:=(new.date+coalesce(new.time,time '09:00')) at time zone new.timezone;
  delete from public.reminders where event_id=new.id and automatic_key is not null;
  insert into public.reminders(event_id,title,remind_at,automatic_key) select new.id,label,at_time,key from (values('Tomorrow: '||new.title,starts-interval '24 hours','before'),('Starting: '||new.title,starts,'start')) v(label,at_time,key) where at_time>now();
 end if;
 if new.status='past' and old.status<>'past' then
  update public.reminders set status='cancelled' where event_id=new.id and sent_at is null;
 end if;return new;
end $$;
drop trigger if exists prelude_reschedule on public.events;
create trigger prelude_reschedule after update on public.events for each row execute function public.prelude_reschedule();

-- Lease reminders until delivery is confirmed, rather than marking them sent first.
create or replace function public.prelude_claim_reminders(p_limit integer default 50) returns table(id uuid,user_id uuid,event_id uuid,title text) language plpgsql security definer set search_path=public,pg_temp as $$begin
 return query with due as(select r.id from public.reminders r join public.events e on e.id=r.event_id where e.status='upcoming' and r.status='pending' and r.sent_at is null and r.remind_at<=now() and r.attempts<5 and (r.claimed_at is null or r.claimed_at<now()-interval '5 minutes') order by r.remind_at for update of r skip locked limit least(greatest(p_limit,1),100)),claimed as(update public.reminders r set claimed_at=now(),attempts=r.attempts+1 from due where r.id=due.id returning r.id,r.event_id,r.title) select c.id,e.user_id,c.event_id,c.title from claimed c join public.events e on e.id=c.event_id;
end $$;
create or replace function public.prelude_claim_timer_alerts(p_limit integer default 50) returns table(id uuid,user_id uuid,event_id uuid,task_id uuid,task_title text) language plpgsql security definer set search_path=public,pg_temp as $$begin
 return query with due as(select s.id from public.task_sessions s join public.events e on e.id=s.event_id where s.state='expired' and s.notified_at is null and s.alert_attempts<5 and (s.alert_claimed_at is null or s.alert_claimed_at<now()-interval '5 minutes') and e.status='upcoming' order by s.updated_at for update of s skip locked limit least(greatest(p_limit,1),100)),claimed as(update public.task_sessions s set alert_claimed_at=now(),alert_attempts=s.alert_attempts+1 from due where s.id=due.id returning s.id,s.user_id,s.event_id,s.task_id) select c.id,c.user_id,c.event_id,c.task_id,t.title from claimed c join public.tasks t on t.id=c.task_id where not t.completed;
end $$;
revoke all on function public.prelude_claim_reminders(integer),public.prelude_claim_timer_alerts(integer) from public,anon,authenticated;
grant execute on function public.prelude_claim_reminders(integer),public.prelude_claim_timer_alerts(integer) to service_role;
-- Limit draft sizes and stored preferences without exposing service credentials.
alter table public.event_drafts drop constraint if exists prelude_draft_size;
alter table public.event_drafts add constraint prelude_draft_size check(pg_column_size(payload)<=200000);

drop policy if exists prelude_media_boundary on storage.objects;
create policy prelude_media_boundary on storage.objects as restrictive for all to public using(bucket_id not in('event-images','memory-photos','avatars') or (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id not in('event-images','memory-photos','avatars') or (storage.foldername(name))[1]=auth.uid()::text);
grant all on public.event_drafts,public.event_memory_photos,public.event_reflections,public.task_sessions,public.signup_proofs to service_role;
do $$begin if to_regprocedure('public.claim_due_reminders(integer)') is not null then execute 'revoke all on function public.claim_due_reminders(integer) from public,anon,authenticated';end if;end $$;
notify pgrst,'reload schema';
commit;
