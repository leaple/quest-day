-- QUEST DAY 1.9: private, version-controlled, whole-game cloud saves.
-- Execute ONCE after the existing 1.6/1.7 SQL in the same Supabase project.
begin;
create table if not exists public.qd_cloud_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 revision bigint not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 constraint qd_cloud_object check (
  jsonb_typeof(data)='object'
  and jsonb_typeof(data->'tasks')='array'
  and jsonb_typeof(data->'events')='array'
 )
);
alter table public.qd_cloud_saves enable row level security;
revoke all on public.qd_cloud_saves from anon,authenticated;
grant select on public.qd_cloud_saves to authenticated;
drop policy if exists qd_cloud_self_read on public.qd_cloud_saves;
create policy qd_cloud_self_read on public.qd_cloud_saves
 for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.qd_cloud_load()
 returns jsonb language plpgsql stable security definer set search_path=''
 as $$
declare me uuid:=auth.uid(); item record;
begin
 if me is null then raise exception 'Sign in first';end if;
 select data,revision,updated_at into item from public.qd_cloud_saves where user_id=me;
 if not found then return jsonb_build_object('exists',false,'revision',0);end if;
 return jsonb_build_object('exists',true,'data',item.data,'revision',item.revision,'updated_at',item.updated_at);
end $$;

-- A stale device cannot overwrite a newer version: saves are atomic compare-and-swap.
create or replace function public.qd_cloud_write(payload jsonb, expected_revision bigint)
 returns jsonb language plpgsql volatile security definer set search_path=''
 as $$
declare me uuid:=auth.uid(); next_rev bigint; at_time timestamptz;
begin
 if me is null then raise exception 'Sign in first';end if;
 if expected_revision is null or expected_revision<0 then raise exception 'Invalid save version';end if;
 if payload is null or jsonb_typeof(payload)<>'object'
 or jsonb_typeof(payload->'tasks')<>'array'
 or jsonb_typeof(payload->'events')<>'array'
 or jsonb_array_length(payload->'tasks')>10000
 or jsonb_array_length(payload->'events')>100000
 or octet_length(convert_to(payload::text,'UTF8'))>5242880 then
  raise exception 'Invalid save, or save over 5 MB';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(me::text,918));
 if expected_revision<>0 and not exists(
   select 1 from public.qd_cloud_saves where user_id=me
 ) then raise exception 'SAVE_CONFLICT: save missing';end if;
 insert into public.qd_cloud_saves(user_id,data,revision,updated_at)
 values(me,payload,1,now())
 on conflict(user_id) do update set
 data=excluded.data,
 revision=public.qd_cloud_saves.revision+1,
 updated_at=now()
 where public.qd_cloud_saves.revision=expected_revision
 returning revision,updated_at into next_rev,at_time;
 if not found then raise exception 'SAVE_CONFLICT: newer cloud data exists';end if;
 return jsonb_build_object('exists',true,'revision',next_rev,'updated_at',at_time);
end $$;

revoke all on function public.qd_cloud_load() from public;
revoke all on function public.qd_cloud_write(jsonb,bigint) from public;
grant execute on function public.qd_cloud_load() to authenticated;
grant execute on function public.qd_cloud_write(jsonb,bigint) to authenticated;

do $$
begin
 if not exists(select 1 from pg_publication_tables
   where pubname='supabase_realtime' and schemaname='public'
   and tablename='qd_cloud_saves') then
  alter publication supabase_realtime add table public.qd_cloud_saves;
 end if;
end $$;
commit;
