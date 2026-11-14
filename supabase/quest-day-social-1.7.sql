-- QUEST DAY v1.7 social features. Execute AFTER quest-day-realtime.sql.
-- Creates a private friends-only chat, party quests, in-app cheers and weekly ranking.
begin;
create table if not exists public.qd_blocks (
 blocker_id uuid references auth.users(id) on delete cascade not null,
 blocked_id uuid references auth.users(id) on delete cascade not null,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id)
);
create table if not exists public.qd_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid references auth.users(id) on delete cascade not null,
 recipient_id uuid references auth.users(id) on delete cascade not null,
 body text not null check(char_length(body) between 1 and 500),
 created_at timestamptz not null default now(),check(sender_id<>recipient_id)
);
create index if not exists qd_messages_inbox on public.qd_messages(recipient_id,created_at desc);
create index if not exists qd_messages_dialogue on public.qd_messages(sender_id,recipient_id,created_at desc);
create table if not exists public.qd_chat_reads(
 user_id uuid references auth.users(id) on delete cascade not null,
 peer_id uuid references auth.users(id) on delete cascade not null,
 last_read_at timestamptz not null default now(),
 primary key(user_id,peer_id),check(user_id<>peer_id)
);
create table if not exists public.qd_cheers (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid references auth.users(id) on delete cascade not null,
 recipient_id uuid references auth.users(id) on delete cascade not null,
 kind text not null check(kind in('spark','cheer','win')),
 seen_at timestamptz,created_at timestamptz not null default now(),
 check(sender_id<>recipient_id)
);
create index if not exists qd_cheers_inbox on public.qd_cheers(recipient_id,created_at desc);
create table if not exists public.qd_parties(
 id uuid primary key default gen_random_uuid(),
 creator_id uuid references auth.users(id) on delete cascade not null,
 invitee_id uuid references auth.users(id) on delete cascade not null,
 target integer not null check(target in(5,10,20)),
 status text not null default 'pending' check(status in('pending','active','declined','cancelled')),
 creator_base integer not null default 0,invitee_base integer not null default 0,
 created_at timestamptz not null default now(),
 check(creator_id<>invitee_id)
);
create index if not exists qd_party_creator on public.qd_parties(creator_id,status);
create index if not exists qd_party_invitee on public.qd_parties(invitee_id,status);
create table if not exists public.qd_weekly_progress(
 user_id uuid references auth.users(id) on delete cascade not null,
 week_start date not null,xp_gained integer not null default 0,
 quests_done integer not null default 0,updated_at timestamptz not null default now(),
 primary key(user_id,week_start)
);
create table if not exists public.qd_reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid references auth.users(id) on delete cascade not null,
 reported_id uuid references auth.users(id) on delete cascade not null,
 message_id uuid references public.qd_messages(id) on delete set null,
 category text not null check(category in('spam','harassment','unsafe','other')),
 created_at timestamptz not null default now()
);

alter table public.qd_blocks enable row level security;
alter table public.qd_messages enable row level security;
alter table public.qd_chat_reads enable row level security;
alter table public.qd_cheers enable row level security;
alter table public.qd_parties enable row level security;
alter table public.qd_weekly_progress enable row level security;
alter table public.qd_reports enable row level security;
revoke all on public.qd_blocks,public.qd_messages,public.qd_chat_reads,public.qd_cheers,
 public.qd_parties,public.qd_weekly_progress,public.qd_reports from anon,authenticated;
grant select on public.qd_blocks,public.qd_messages,public.qd_chat_reads,public.qd_cheers,
 public.qd_parties,public.qd_weekly_progress,public.qd_reports to authenticated;

create or replace function public.qd_can_contact(a uuid,b uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(a<>b and auth.uid() in(a,b)
 and exists(select 1 from public.qd_friendships f
 where f.user_a=least(a,b) and f.user_b=greatest(a,b) and f.active)
 and not exists(select 1 from public.qd_blocks bl
 where (bl.blocker_id=a and bl.blocked_id=b) or (bl.blocker_id=b and bl.blocked_id=a)),false)
$$;
create policy qd17_blocks_read on public.qd_blocks for select to authenticated
 using(blocker_id=(select auth.uid()));
create policy qd17_msgs_read on public.qd_messages for select to authenticated
 using((sender_id=(select auth.uid()) or recipient_id=(select auth.uid()))
 and public.qd_can_contact(sender_id,recipient_id));
create policy qd17_reads_owner on public.qd_chat_reads for select to authenticated
 using(user_id=(select auth.uid()));
create policy qd17_cheers_read on public.qd_cheers for select to authenticated
 using((sender_id=(select auth.uid()) or recipient_id=(select auth.uid()))
 and public.qd_can_contact(sender_id,recipient_id));
create policy qd17_parties_read on public.qd_parties for select to authenticated
 using((creator_id=(select auth.uid()) or invitee_id=(select auth.uid()))
 and public.qd_can_contact(creator_id,invitee_id));
create policy qd17_weekly_read on public.qd_weekly_progress for select to authenticated
 using(user_id=(select auth.uid()) or public.qd_can_contact(user_id,(select auth.uid())));
create policy qd17_reports_read on public.qd_reports for select to authenticated
 using(reporter_id=(select auth.uid()));

-- This records only positive changes after installation, grouped by Korean calendar week.
create or replace function public.qd_track_weekly() returns trigger
language plpgsql security definer set search_path='' as $$
declare dx integer;dq integer; monday date;
begin
 dx=greatest(new.xp-old.xp,0);dq=greatest(new.quests-old.quests,0);
 if dx=0 and dq=0 then return new;end if;
 monday=date_trunc('week',timezone('Asia/Seoul',now()))::date;
 insert into public.qd_weekly_progress(user_id,week_start,xp_gained,quests_done)
 values(new.user_id,monday,dx,dq)
 on conflict(user_id,week_start) do update
 set xp_gained=least(public.qd_weekly_progress.xp_gained+excluded.xp_gained,1000000000),
 quests_done=least(public.qd_weekly_progress.quests_done+excluded.quests_done,10000000),
 updated_at=now();
 return new;
end $$;
drop trigger if exists qd_weekly_profile_update on public.qd_profiles;
create trigger qd_weekly_profile_update after update on public.qd_profiles
for each row execute function public.qd_track_weekly();

create or replace function public.qd_weekly_ranking()
returns table(user_id uuid,nickname text,avatar text,week_xp integer,week_quests integer)
language sql stable security definer set search_path='' as $$
 select p.user_id,p.nickname,p.avatar,coalesce(w.xp_gained,0)::integer,coalesce(w.quests_done,0)::integer
 from public.qd_profiles p left join public.qd_weekly_progress w
 on w.user_id=p.user_id and w.week_start=date_trunc('week',timezone('Asia/Seoul',now()))::date
 where p.user_id=auth.uid() or public.qd_can_contact(p.user_id,auth.uid())
 order by coalesce(w.xp_gained,0) desc,p.nickname limit 101
$$;
create or replace function public.qd_send_message(friend_id uuid,message_body text)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();body_value text:=btrim(message_body);created uuid;
begin
 if me is null or not public.qd_can_contact(me,friend_id) then raise exception 'Only friends can chat';end if;
 if body_value is null or char_length(body_value) not between 1 and 500 then
 raise exception 'Message must be 1 to 500 characters';end if;
 if (select count(*) from public.qd_messages
 where sender_id=me and created_at>now()-interval '1 hour')>=45 then
 raise exception 'Hourly message limit reached';end if;
 insert into public.qd_messages(sender_id,recipient_id,body)
 values(me,friend_id,body_value) returning id into created;
 return created;
end $$;
create or replace function public.qd_mark_chat_read(friend_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
 if me is null or not public.qd_can_contact(me,friend_id) then raise exception 'Not friends';end if;
 insert into public.qd_chat_reads(user_id,peer_id,last_read_at) values(me,friend_id,now())
 on conflict(user_id,peer_id) do update set last_read_at=now();
 return true;
end $$;
create or replace function public.qd_unread_chat_counts()
returns table(partner_id uuid,unread_count integer)
language sql stable security definer set search_path='' as $$
 select m.sender_id,count(*)::integer from public.qd_messages m
 left join public.qd_chat_reads r on r.user_id=auth.uid() and r.peer_id=m.sender_id
 where m.recipient_id=auth.uid()
 and m.created_at>coalesce(r.last_read_at,'epoch'::timestamptz)
 and public.qd_can_contact(m.sender_id,m.recipient_id)
 group by m.sender_id
$$;

create or replace function public.qd_send_cheer(friend_id uuid,cheer_kind text)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();created uuid;
begin
 if me is null or not public.qd_can_contact(me,friend_id) then raise exception 'Only friends can cheer';end if;
 if cheer_kind is null or cheer_kind not in('spark','cheer','win') then raise exception 'Invalid cheer';end if;
 if(select count(*) from public.qd_cheers
 where sender_id=me and recipient_id=friend_id and created_at>now()-interval '1 day')>=10
 then raise exception 'Daily cheer limit reached';end if;
 insert into public.qd_cheers(sender_id,recipient_id,kind)
 values(me,friend_id,cheer_kind) returning id into created;
 return created;
end $$;
create or replace function public.qd_mark_cheers_seen()
returns integer language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 update public.qd_cheers set seen_at=now() where recipient_id=auth.uid() and seen_at is null;
 get diagnostics changed=row_count;
 return changed;
end $$;

create or replace function public.qd_create_party(friend_id uuid,goal integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();created uuid;
begin
 if me is null or not public.qd_can_contact(me,friend_id) then raise exception 'Only friends can form parties';end if;
 if goal is null or goal not in(5,10,20) then raise exception 'Invalid goal';end if;
 if(select count(*) from public.qd_parties
 where creator_id=me and created_at>now()-interval '7 days')>=8 then
 raise exception 'Weekly party invite limit reached';end if;
 if(select count(*) from public.qd_parties where status in('pending','active')
 and ((creator_id=me and invitee_id=friend_id) or (creator_id=friend_id and invitee_id=me)))>=2
 then raise exception 'Too many parties with this friend';end if;
 insert into public.qd_parties(creator_id,invitee_id,target)
 values(me,friend_id,goal) returning id into created;
 return created;
end $$;
create or replace function public.qd_respond_party(party_id uuid,approve boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();owner_id uuid;
begin
 if me is null then raise exception 'Sign in first';end if;
 select creator_id into owner_id from public.qd_parties
 where id=party_id and invitee_id=me and status='pending' for update;
 if owner_id is null then raise exception 'Invite not found';end if;
 if approve and not public.qd_can_contact(me,owner_id) then raise exception 'Not friends';end if;
 update public.qd_parties set status=case when approve then 'active' else 'declined' end,
 creator_base=case when approve then coalesce((select quests from public.qd_profiles
 where user_id=owner_id),0) else creator_base end,
 invitee_base=case when approve then coalesce((select quests from public.qd_profiles
 where user_id=me),0) else invitee_base end where id=party_id;
 return true;
end $$;
create or replace function public.qd_cancel_party(party_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.qd_parties set status='cancelled'
 where id=party_id and (creator_id=auth.uid() or invitee_id=auth.uid())
 and status in('pending','active');
 if not found then raise exception 'Party not found';end if;
 return true;
end $$;
create or replace function public.qd_my_parties()
returns table(id uuid,partner_id uuid,partner_nickname text,target integer,status text,
 direction text,my_completed integer,partner_completed integer,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select p.id,
 case when p.creator_id=auth.uid() then p.invitee_id else p.creator_id end,
 coalesce(partner.nickname,'모험가'),p.target,p.status,
 case when p.creator_id=auth.uid() then 'sent'::text else 'received'::text end,
 case when p.status='active' then greatest(coalesce(mine.quests,0)-
 (case when p.creator_id=auth.uid() then p.creator_base else p.invitee_base end),0) else 0 end,
 case when p.status='active' then greatest(coalesce(partner.quests,0)-
 (case when p.creator_id=auth.uid() then p.invitee_base else p.creator_base end),0) else 0 end,
 p.created_at
 from public.qd_parties p join public.qd_profiles partner on partner.user_id=
 (case when p.creator_id=auth.uid() then p.invitee_id else p.creator_id end)
 left join public.qd_profiles mine on mine.user_id=auth.uid()
 where (p.creator_id=auth.uid() or p.invitee_id=auth.uid())
 and p.status in('pending','active') and public.qd_can_contact(p.creator_id,p.invitee_id)
 order by p.created_at desc limit 30
$$;

create or replace function public.qd_report_message(msg_id uuid,report_category text)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();sender uuid;
begin
 if me is null then raise exception 'Sign in first';end if;
 if report_category is null or report_category not in('spam','harassment','unsafe','other') then
 raise exception 'Invalid category';end if;
 select sender_id into sender from public.qd_messages where id=msg_id and recipient_id=me;
 if sender is null then raise exception 'Message not found';end if;
 if exists(select 1 from public.qd_reports where reporter_id=me and message_id=msg_id)
 then raise exception 'Already reported';end if;
 if (select count(*) from public.qd_reports
 where reporter_id=me and created_at>now()-interval '1 day')>=20
 then raise exception 'Daily report limit reached';end if;
 insert into public.qd_reports(reporter_id,reported_id,message_id,category)
 values(me,sender,msg_id,report_category);
 return true;
end $$;
create or replace function public.qd_block_user(friend_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
 if me is null or friend_id is null or me=friend_id then raise exception 'Invalid user';end if;
 if not exists(select 1 from public.qd_friendships f
 where f.user_a=least(me,friend_id) and f.user_b=greatest(me,friend_id))
 and not exists(select 1 from public.qd_messages m where
 (m.sender_id=me and m.recipient_id=friend_id) or (m.sender_id=friend_id and m.recipient_id=me))
 then raise exception 'User not found among friends';end if;
 insert into public.qd_blocks(blocker_id,blocked_id) values(me,friend_id)
 on conflict(blocker_id,blocked_id) do nothing;
 update public.qd_friendships set active=false
 where user_a=least(me,friend_id) and user_b=greatest(me,friend_id);
 update public.qd_friend_requests set status='cancelled',updated_at=now()
 where status='pending' and ((sender_id=me and recipient_id=friend_id)
 or (sender_id=friend_id and recipient_id=me));
 update public.qd_parties set status='cancelled' where status in('pending','active')
 and ((creator_id=me and invitee_id=friend_id) or (creator_id=friend_id and invitee_id=me));
 return true;
end $$;
create or replace function public.qd_unblock_user(friend_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 delete from public.qd_blocks where blocker_id=auth.uid() and blocked_id=friend_id;
 if not found then raise exception 'User not blocked';end if;
 return true;
end $$;

-- Replace original invitation request RPC so a blocked user cannot re-invite.
create or replace function public.qd_send_request(invite_code text)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();target uuid;created uuid;
begin
 if me is null then raise exception 'Sign in first';end if;
 if invite_code is null or invite_code !~ '^[0-9a-f]{32}$' then raise exception 'Invalid code';end if;
 select user_id into target from public.qd_invites where code=invite_code;
 if target is null or target=me then raise exception 'Invalid friend';end if;
 if exists(select 1 from public.qd_blocks b where
 (b.blocker_id=me and b.blocked_id=target) or (b.blocker_id=target and b.blocked_id=me))
 then raise exception 'Request unavailable';end if;
 if exists(select 1 from public.qd_friendships f
 where f.user_a=least(me,target) and f.user_b=greatest(me,target) and f.active)
 then raise exception 'Already friends';end if;
 if (select count(*) from public.qd_friendships f where f.active
 and (f.user_a=me or f.user_b=me))>=100
 or (select count(*) from public.qd_friendships f where f.active
 and (f.user_a=target or f.user_b=target))>=100
 then raise exception 'Friend list is full';end if;
 if exists(select 1 from public.qd_friend_requests r where r.status='pending'
 and ((r.sender_id=me and r.recipient_id=target)
 or (r.sender_id=target and r.recipient_id=me))) then raise exception 'Request pending';end if;
 if(select count(*) from public.qd_friend_requests r
 where r.sender_id=me and r.created_at>now()-interval '1 day')>=20
 then raise exception 'Daily invite limit reached';end if;
 insert into public.qd_friend_requests(sender_id,recipient_id)
 values(me,target) returning id into created;
 return created;
end $$;

-- Extend delete-sharing-data RPC to the social feature tables too.
create or replace function public.qd_remove_my_profile()
returns boolean language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
 if me is null then raise exception 'Sign in first';end if;
 update public.qd_friend_requests set status='cancelled',updated_at=now()
 where (sender_id=me or recipient_id=me) and status='pending';
 update public.qd_friendships set active=false where user_a=me or user_b=me;
 delete from public.qd_reports where reporter_id=me or reported_id=me;
 delete from public.qd_messages where sender_id=me or recipient_id=me;
 delete from public.qd_chat_reads where user_id=me or peer_id=me;
 delete from public.qd_cheers where sender_id=me or recipient_id=me;
 delete from public.qd_parties where creator_id=me or invitee_id=me;
 delete from public.qd_weekly_progress where user_id=me;
 delete from public.qd_blocks where blocker_id=me or blocked_id=me;
 delete from public.qd_friend_requests where sender_id=me or recipient_id=me;
 delete from public.qd_friendships where user_a=me or user_b=me;
 delete from public.qd_invites where user_id=me;
 delete from public.qd_profiles where user_id=me;
 return true;
end $$;

revoke all on function public.qd_track_weekly() from public;
revoke all on function public.qd_can_contact(uuid,uuid) from public;
revoke all on function public.qd_weekly_ranking() from public;
revoke all on function public.qd_send_message(uuid,text) from public;
revoke all on function public.qd_mark_chat_read(uuid) from public;
revoke all on function public.qd_unread_chat_counts() from public;
revoke all on function public.qd_send_cheer(uuid,text) from public;
revoke all on function public.qd_mark_cheers_seen() from public;
revoke all on function public.qd_create_party(uuid,integer) from public;
revoke all on function public.qd_respond_party(uuid,boolean) from public;
revoke all on function public.qd_cancel_party(uuid) from public;
revoke all on function public.qd_my_parties() from public;
revoke all on function public.qd_report_message(uuid,text) from public;
revoke all on function public.qd_block_user(uuid) from public;
revoke all on function public.qd_unblock_user(uuid) from public;
revoke all on function public.qd_send_request(text) from public;
revoke all on function public.qd_remove_my_profile() from public;
grant execute on function public.qd_can_contact(uuid,uuid) to authenticated;
grant execute on function public.qd_weekly_ranking() to authenticated;
grant execute on function public.qd_send_message(uuid,text) to authenticated;
grant execute on function public.qd_mark_chat_read(uuid) to authenticated;
grant execute on function public.qd_unread_chat_counts() to authenticated;
grant execute on function public.qd_send_cheer(uuid,text) to authenticated;
grant execute on function public.qd_mark_cheers_seen() to authenticated;
grant execute on function public.qd_create_party(uuid,integer) to authenticated;
grant execute on function public.qd_respond_party(uuid,boolean) to authenticated;
grant execute on function public.qd_cancel_party(uuid) to authenticated;
grant execute on function public.qd_my_parties() to authenticated;
grant execute on function public.qd_report_message(uuid,text) to authenticated;
grant execute on function public.qd_block_user(uuid) to authenticated;
grant execute on function public.qd_unblock_user(uuid) to authenticated;
grant execute on function public.qd_send_request(text) to authenticated;
grant execute on function public.qd_remove_my_profile() to authenticated;

-- RLS gates INSERT/UPDATE Postgres Change events.
do $$
declare t text;
begin
 foreach t in array array['qd_messages','qd_cheers','qd_parties','qd_weekly_progress'] loop
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
  and schemaname='public' and tablename=t) then
 execute format('alter publication supabase_realtime add table public.%I',t);
 end if;
 end loop;
end $$;
commit;
