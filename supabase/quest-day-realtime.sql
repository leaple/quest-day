-- QUEST DAY 1.6: server-backed friends with mutual consent
-- Run once in your own Supabase project's SQL Editor.
-- Shares only opted-in nickname/avatar and summary counts.
-- No raw quest titles, event logs, contact details or messages are stored.
begin;

create table if not exists public.qd_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null default '모험가' check (char_length(nickname) between 1 and 16),
 avatar text not null default 'sprout' check (char_length(avatar) between 1 and 48 and avatar ~ '^[a-z_]+$'),
 level integer not null default 1 check (level between 1 and 100000),
 xp integer not null default 0 check (xp between 0 and 1000000000),
 quests integer not null default 0 check (quests between 0 and 10000000),
 streak integer not null default 0 check (streak between 0 and 100000),
 updated_at timestamptz not null default now()
);
create table if not exists public.qd_invites (
 user_id uuid primary key references auth.users(id) on delete cascade,
 code text unique not null default replace(gen_random_uuid()::text, '-', '')
);
create table if not exists public.qd_friend_requests (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending'
   check (status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint no_self_request check (sender_id <> recipient_id)
);
create unique index if not exists qd_only_one_pending
 on public.qd_friend_requests(sender_id, recipient_id) where status='pending';
create index if not exists qd_req_inbox on public.qd_friend_requests(recipient_id, status);
create index if not exists qd_req_outbox on public.qd_friend_requests(sender_id, status);

create table if not exists public.qd_friendships (
 user_a uuid not null references auth.users(id) on delete cascade,
 user_b uuid not null references auth.users(id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key(user_a,user_b),
 constraint ordered_friendship check (user_a<user_b)
);
create index if not exists qd_friends_b on public.qd_friendships(user_b,active);

alter table public.qd_profiles enable row level security;
alter table public.qd_invites enable row level security;
alter table public.qd_friend_requests enable row level security;
alter table public.qd_friendships enable row level security;

revoke all on public.qd_profiles,public.qd_invites,public.qd_friend_requests,public.qd_friendships from anon;
revoke all on public.qd_profiles,public.qd_invites,public.qd_friend_requests,public.qd_friendships from authenticated;
grant select,insert,update on public.qd_profiles to authenticated;
grant select on public.qd_invites,public.qd_friend_requests,public.qd_friendships to authenticated;

drop policy if exists qd_profiles_read on public.qd_profiles;
create policy qd_profiles_read on public.qd_profiles for select to authenticated using (
 user_id=(select auth.uid()) or exists (
  select 1 from public.qd_friendships f
  where f.active and (
   (f.user_a=(select auth.uid()) and f.user_b=qd_profiles.user_id)
   or (f.user_b=(select auth.uid()) and f.user_a=qd_profiles.user_id)
  )
 )
);
drop policy if exists qd_profiles_create on public.qd_profiles;
create policy qd_profiles_create on public.qd_profiles for insert to authenticated
 with check (user_id=(select auth.uid()));
drop policy if exists qd_profiles_edit on public.qd_profiles;
create policy qd_profiles_edit on public.qd_profiles for update to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop policy if exists qd_invite_owner on public.qd_invites;
create policy qd_invite_owner on public.qd_invites for select to authenticated
 using(user_id=(select auth.uid()));
drop policy if exists qd_request_participants on public.qd_friend_requests;
create policy qd_request_participants on public.qd_friend_requests for select to authenticated
 using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
drop policy if exists qd_friend_participants on public.qd_friendships;
create policy qd_friend_participants on public.qd_friendships for select to authenticated
 using(user_a=(select auth.uid()) or user_b=(select auth.uid()));

-- Keep all writes to the invitation/request/friendship tables in reviewed RPCs.
create or replace function public.qd_bootstrap()
 returns text language plpgsql security definer set search_path = ''
 as $$
declare me uuid := auth.uid(); code_value text;
begin
 if me is null then raise exception 'Sign in first'; end if;
 insert into public.qd_profiles(user_id) values(me) on conflict do nothing;
 insert into public.qd_invites(user_id) values(me) on conflict do nothing;
 select code into code_value from public.qd_invites where user_id=me;
 return code_value;
end $$;

create or replace function public.qd_rotate_invite()
 returns text language plpgsql security definer set search_path = ''
 as $$
declare me uuid := auth.uid(); next_code text := replace(gen_random_uuid()::text,'-','');
begin
 if me is null then raise exception 'Sign in first'; end if;
 update public.qd_invites set code=next_code where user_id=me;
 if not found then
  insert into public.qd_invites(user_id,code) values(me,next_code);
 end if;
 return next_code;
end $$;

create or replace function public.qd_send_request(invite_code text)
 returns uuid language plpgsql security definer set search_path = ''
 as $$
declare me uuid := auth.uid(); target uuid; request_id uuid;
begin
 if me is null then raise exception 'Sign in first'; end if;
 if invite_code is null or invite_code !~ '^[0-9a-f]{32}$' then
  raise exception 'Invalid invitation code';
 end if;
 select user_id into target from public.qd_invites where code=invite_code;
 if target is null then raise exception 'Invitation code not found'; end if;
 if target=me then raise exception 'Cannot add yourself'; end if;
 if exists(select 1 from public.qd_friendships f
   where f.user_a=least(me,target) and f.user_b=greatest(me,target) and f.active)
 then raise exception 'Already friends'; end if;
 if (select count(*) from public.qd_friendships f
   where f.active and (f.user_a=me or f.user_b=me))>=100
 then raise exception 'Your friend list is full'; end if;
 if (select count(*) from public.qd_friendships f
   where f.active and (f.user_a=target or f.user_b=target))>=100
 then raise exception 'Recipient friend list is full'; end if;
 if exists(select 1 from public.qd_friend_requests r where r.status='pending'
   and ((r.sender_id=me and r.recipient_id=target)
     or (r.sender_id=target and r.recipient_id=me)))
 then raise exception 'Friend request already pending'; end if;
 if (select count(*) from public.qd_friend_requests r where r.sender_id=me
    and r.created_at>now()-interval '1 day')>=20
 then raise exception 'Daily friend request limit reached'; end if;
 insert into public.qd_friend_requests(sender_id,recipient_id)
 values(me,target) returning id into request_id;
 return request_id;
end $$;

create or replace function public.qd_request_previews()
 returns table(request_id uuid, partner_id uuid, nickname text, avatar text,
               direction text, created_at timestamptz)
 language sql stable security definer set search_path = ''
 as $$
 select r.id,
  case when r.sender_id=auth.uid() then r.recipient_id else r.sender_id end,
  p.nickname,p.avatar,
  case when r.sender_id=auth.uid() then 'sent'::text else 'received'::text end,
  r.created_at
 from public.qd_friend_requests r
 join public.qd_profiles p on p.user_id=
  (case when r.sender_id=auth.uid() then r.recipient_id else r.sender_id end)
 where (r.sender_id=auth.uid() or r.recipient_id=auth.uid())
   and r.status='pending'
 order by r.created_at desc
 $$;

create or replace function public.qd_respond_request(req_id uuid, approve boolean)
 returns boolean language plpgsql security definer set search_path = ''
 as $$
declare me uuid:=auth.uid(); sender uuid;
begin
 if me is null then raise exception 'Sign in first'; end if;
 select sender_id into sender from public.qd_friend_requests
 where id=req_id and recipient_id=me and status='pending' for update;
 if sender is null then raise exception 'Request not found'; end if;
 if approve then
   if (select count(*) from public.qd_friendships f where f.active and (f.user_a=me or f.user_b=me))>=100
     or (select count(*) from public.qd_friendships f where f.active and (f.user_a=sender or f.user_b=sender))>=100
   then raise exception 'Friend list is full'; end if;
   insert into public.qd_friendships(user_a,user_b,active)
     values(least(me,sender),greatest(me,sender),true)
     on conflict(user_a,user_b) do update set active=true;
 end if;
 update public.qd_friend_requests set status=case when approve then 'accepted' else 'declined' end,
    updated_at=now() where id=req_id;
 return true;
end $$;

create or replace function public.qd_cancel_request(req_id uuid)
 returns boolean language plpgsql security definer set search_path = ''
 as $$
begin
 update public.qd_friend_requests
 set status='cancelled', updated_at=now()
 where id=req_id and sender_id=auth.uid() and status='pending';
 if not found then raise exception 'Request not found'; end if;
 return true;
end $$;

create or replace function public.qd_remove_friend(friend_id uuid)
 returns boolean language plpgsql security definer set search_path = ''
 as $$
declare me uuid:=auth.uid();
begin
 if me is null or friend_id is null or me=friend_id then raise exception 'Invalid friend'; end if;
 update public.qd_friendships
 set active=false where user_a=least(me,friend_id) and user_b=greatest(me,friend_id) and active;
 if not found then raise exception 'Friend not found'; end if;
 return true;
end $$;

-- Deletes only the QUEST DAY friend data hosted in this project.
-- The anonymous Supabase Auth user itself remains; it has no active shared profile.
create or replace function public.qd_remove_my_profile()
 returns boolean language plpgsql security definer set search_path = ''
 as $
declare me uuid:=auth.uid();
begin
 if me is null then raise exception 'Sign in first'; end if;
 -- Notify existing connections of the upcoming deletion via RLS-visible UPDATEs.
 update public.qd_friend_requests set status='cancelled',updated_at=now()
   where (sender_id=me or recipient_id=me) and status='pending';
 update public.qd_friendships set active=false where user_a=me or user_b=me;
 delete from public.qd_friend_requests where sender_id=me or recipient_id=me;
 delete from public.qd_friendships where user_a=me or user_b=me;
 delete from public.qd_invites where user_id=me;
 delete from public.qd_profiles where user_id=me;
 return true;
end $;

revoke all on function public.qd_bootstrap() from public;
revoke all on function public.qd_rotate_invite() from public;
revoke all on function public.qd_send_request(text) from public;
revoke all on function public.qd_request_previews() from public;
revoke all on function public.qd_respond_request(uuid,boolean) from public;
revoke all on function public.qd_cancel_request(uuid) from public;
revoke all on function public.qd_remove_friend(uuid) from public;
revoke all on function public.qd_remove_my_profile() from public;
grant execute on function public.qd_bootstrap() to authenticated;
grant execute on function public.qd_rotate_invite() to authenticated;
grant execute on function public.qd_send_request(text) to authenticated;
grant execute on function public.qd_request_previews() to authenticated;
grant execute on function public.qd_respond_request(uuid,boolean) to authenticated;
grant execute on function public.qd_cancel_request(uuid) to authenticated;
grant execute on function public.qd_remove_friend(uuid) to authenticated;
grant execute on function public.qd_remove_my_profile() to authenticated;

-- Allow Realtime Postgres Changes for only these three tables.
do $$
declare tab text;
begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
   create publication supabase_realtime;
 end if;
 foreach tab in array array['qd_profiles','qd_friend_requests','qd_friendships'] loop
   if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename=tab
   ) then
    execute format('alter publication supabase_realtime add table public.%I',tab);
   end if;
 end loop;
end $$;

commit;
