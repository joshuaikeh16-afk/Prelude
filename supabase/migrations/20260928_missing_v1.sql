-- Prelude V1 missing backend pieces. Run after the existing Prelude schema migration.
create table if not exists public.goals (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, title text not null check (char_length(trim(title)) between 1 and 300), created_at timestamptz not null default now());
create table if not exists public.notes (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, content text not null default '', updated_at timestamptz not null default now(), created_at timestamptz not null default now());
create table if not exists public.schedule_items (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, title text not null check (char_length(trim(title)) between 1 and 200), start_at timestamptz not null, end_at timestamptz, created_at timestamptz not null default now(), check (end_at is null or end_at > start_at));
create table if not exists public.reminders (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, task_id uuid references public.tasks(id) on delete cascade, remind_at timestamptz not null, timezone text not null, title text not null check (char_length(trim(title)) between 1 and 200), sent_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, endpoint text not null unique, p256dh text not null, auth text not null, user_agent text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.dismissed_suggestions (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, suggestion_key text not null, dismissed_at timestamptz not null default now(), unique(event_id, suggestion_key));
create index if not exists goals_event_id_idx on public.goals(event_id);
create index if not exists notes_event_id_idx on public.notes(event_id);
create index if not exists schedule_items_event_start_idx on public.schedule_items(event_id,start_at);
create index if not exists reminders_due_idx on public.reminders(remind_at) where sent_at is null;
create index if not exists reminders_event_id_idx on public.reminders(event_id);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create index if not exists dismissed_suggestions_event_id_idx on public.dismissed_suggestions(event_id);

alter table public.goals enable row level security;
alter table public.notes enable row level security;
alter table public.schedule_items enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.dismissed_suggestions enable row level security;

drop policy if exists goals_owner_all on public.goals;
create policy goals_owner_all on public.goals for all using (exists (select 1 from public.events e where e.id=goals.event_id and e.user_id=auth.uid())) with check (exists (select 1 from public.events e where e.id=goals.event_id and e.user_id=auth.uid()));
drop policy if exists notes_owner_all on public.notes;
create policy notes_owner_all on public.notes for all using (exists (select 1 from public.events e where e.id=notes.event_id and e.user_id=auth.uid())) with check (exists (select 1 from public.events e where e.id=notes.event_id and e.user_id=auth.uid()));
drop policy if exists schedule_owner_all on public.schedule_items;
create policy schedule_owner_all on public.schedule_items for all using (exists (select 1 from public.events e where e.id=schedule_items.event_id and e.user_id=auth.uid())) with check (exists (select 1 from public.events e where e.id=schedule_items.event_id and e.user_id=auth.uid()));
drop policy if exists reminders_owner_all on public.reminders;
create policy reminders_owner_all on public.reminders for all using (exists (select 1 from public.events e where e.id=reminders.event_id and e.user_id=auth.uid())) with check (exists (select 1 from public.events e where e.id=reminders.event_id and e.user_id=auth.uid()) and (task_id is null or exists (select 1 from public.tasks t join public.events e2 on e2.id=t.event_id where t.id=reminders.task_id and t.event_id=reminders.event_id and e2.user_id=auth.uid())));
drop policy if exists push_owner_all on public.push_subscriptions;
create policy push_owner_all on public.push_subscriptions for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists dismissed_owner_all on public.dismissed_suggestions;
create policy dismissed_owner_all on public.dismissed_suggestions for all using (exists (select 1 from public.events e where e.id=dismissed_suggestions.event_id and e.user_id=auth.uid())) with check (exists (select 1 from public.events e where e.id=dismissed_suggestions.event_id and e.user_id=auth.uid()));

create or replace function public.claim_due_reminders(p_limit integer default 50)
returns table (id uuid,event_id uuid,task_id uuid,title text,user_id uuid)
language sql security definer set search_path=public
as $$
  update public.reminders r set sent_at=now()
  where r.id in (select r2.id from public.reminders r2 where r2.sent_at is null and r2.remind_at<=now() order by r2.remind_at for update skip locked limit greatest(1,least(p_limit,200)))
  returning r.id,r.event_id,r.task_id,r.title,(select e.user_id from public.events e where e.id=r.event_id);
$$;
revoke all on function public.claim_due_reminders(integer) from public,anon,authenticated;
grant execute on function public.claim_due_reminders(integer) to service_role;
