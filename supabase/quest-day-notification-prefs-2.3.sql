-- QUEST DAY 2.3: per-authenticated-user, opt-in alert preferences.
-- Applied to Quest Day Supabase project 2026-11-15.
-- This table is separate from game saves: no changes to quests, events,
-- users, friends, cloud save revisions, experience, or characters.
create table if not exists public.qd_notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  morning boolean not null default true,
  evening boolean not null default true,
  friends boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.qd_notification_prefs enable row level security;
revoke all on table public.qd_notification_prefs from public, anon;
grant select,insert,update on table public.qd_notification_prefs to authenticated;
drop policy if exists qd_notification_prefs_read on public.qd_notification_prefs;
create policy qd_notification_prefs_read on public.qd_notification_prefs
  for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists qd_notification_prefs_insert on public.qd_notification_prefs;
create policy qd_notification_prefs_insert on public.qd_notification_prefs
  for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists qd_notification_prefs_update on public.qd_notification_prefs;
create policy qd_notification_prefs_update on public.qd_notification_prefs
  for update to authenticated using(user_id=(select auth.uid()))
  with check(user_id=(select auth.uid()));
