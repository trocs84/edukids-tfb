-- Shared application schema. Supabase supplies auth.users/auth.uid().
-- Local-only auth bootstrap lives in lib/local-db.ts and is NOT a cloud migration.
create schema if not exists private;
create table public.child_profiles(
 id uuid primary key default gen_random_uuid(),adult_id uuid not null references auth.users(id) on delete cascade,
 alias text not null check(length(trim(alias)) between 1 and 24),avatar text not null check(avatar in ('star','circle','triangle')),
 age_band text not null check(age_band in ('5','6-8','9')),archived boolean not null default false,created_at timestamptz not null default now());
create index child_profiles_adult_idx on public.child_profiles(adult_id);
create table public.activities(id text primary key check(id in ('catch','race','memory')),title text not null,kind text not null,version integer not null default 1,active boolean not null default true);
create table public.activity_items(id text primary key,activity_id text not null references public.activities(id),level integer not null check(level between 1 and 3),ordinal integer not null check(ordinal between 1 and 5),prompt text not null,options jsonb not null,solution jsonb not null,hint text not null,unique(activity_id,level,ordinal));
create table public.profile_activity(profile_id uuid not null references public.child_profiles(id) on delete cascade,activity_id text not null references public.activities(id),enabled boolean not null default true,level integer not null default 1 check(level between 1 and 3),primary key(profile_id,activity_id));
create table public.play_sessions(id uuid primary key default gen_random_uuid(),profile_id uuid not null references public.child_profiles(id) on delete cascade,activity_id text not null references public.activities(id),activity_version integer not null,level integer not null check(level between 1 and 3),status text not null default 'active' check(status in ('active','completed','interrupted')),created_at timestamptz not null default now(),ended_at timestamptz,check((status='active' and ended_at is null) or (status<>'active' and ended_at is not null)));
create index play_sessions_profile_idx on public.play_sessions(profile_id,created_at desc);
create table public.responses(id uuid primary key default gen_random_uuid(),session_id uuid not null references public.play_sessions(id) on delete cascade,item_id text not null references public.activity_items(id),answer jsonb not null,correct boolean not null,hint_used boolean not null,latency_ms integer not null check(latency_ms between 0 and 3600000),exposure_ms integer not null default 0 check(exposure_ms between 0 and 3600000),attempt_no integer not null check(attempt_no in(1,2)),created_at timestamptz not null default now(),unique(session_id,item_id,attempt_no));
create index responses_item_idx on public.responses(item_id);
-- RLS and minimum grants for the Data API.
alter table public.child_profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_items enable row level security;
alter table public.profile_activity enable row level security;
alter table public.play_sessions enable row level security;
alter table public.responses enable row level security;
grant usage on schema public to authenticated;
grant select,insert,update on public.child_profiles,public.profile_activity to authenticated;
grant select on public.activities,public.activity_items,public.play_sessions,public.responses to authenticated;
create policy own_profiles_read on public.child_profiles for select to authenticated using(adult_id=(select auth.uid()));
create policy own_profiles_insert on public.child_profiles for insert to authenticated with check(adult_id=(select auth.uid()));
create policy own_profiles_update on public.child_profiles for update to authenticated using(adult_id=(select auth.uid())) with check(adult_id=(select auth.uid()));
create policy catalog_read on public.activities for select to authenticated using(true);
create policy items_read on public.activity_items for select to authenticated using(true);
create policy own_settings on public.profile_activity for all to authenticated using(exists(select 1 from public.child_profiles p where p.id=profile_id and p.adult_id=(select auth.uid()))) with check(exists(select 1 from public.child_profiles p where p.id=profile_id and p.adult_id=(select auth.uid())));
create policy own_sessions on public.play_sessions for select to authenticated using(exists(select 1 from public.child_profiles p where p.id=profile_id and p.adult_id=(select auth.uid())));
create policy own_responses on public.responses for select to authenticated using(exists(select 1 from public.play_sessions s join public.child_profiles p on p.id=s.profile_id where s.id=session_id and p.adult_id=(select auth.uid())));
-- Definer functions are confined to private, with explicit identity and ownership checks.
-- Needed because clients have no direct INSERT/UPDATE grants on sessions or responses.
create function private.start_play(p_profile uuid,p_activity text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_level integer;v_enabled boolean;v_id uuid;v_version integer;
begin
 if auth.uid() is null or not exists(select 1 from public.child_profiles where id=p_profile and adult_id=auth.uid() and not archived) then raise exception 'Access denied';end if;
 select version into v_version from public.activities where id=p_activity and active;if not found then raise exception 'Activity unavailable';end if;
 select level,enabled into v_level,v_enabled from public.profile_activity where profile_id=p_profile and activity_id=p_activity;
 if v_enabled=false then raise exception 'Activity disabled';end if;v_level:=coalesce(v_level,1);
 insert into public.play_sessions(profile_id,activity_id,activity_version,level) values(p_profile,p_activity,v_version,v_level) returning id into v_id;
 return jsonb_build_object('id',v_id,'level',v_level);
end $$;
create function private.record_answer(p_session uuid,p_item text,p_answer jsonb,p_hint boolean,p_latency integer,p_exposure integer,p_attempt integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.play_sessions; i public.activity_items;old public.responses;v_correct boolean;v_closed integer;v_count integer;
begin
 select * into s from public.play_sessions where id=p_session for update;
 if s.id is null or auth.uid() is null or not exists(select 1 from public.child_profiles where id=s.profile_id and adult_id=auth.uid()) then raise exception 'Access denied';end if;
 select * into old from public.responses where session_id=p_session and item_id=p_item and attempt_no=p_attempt;
 if found then if old.answer<>p_answer or old.hint_used<>p_hint then raise exception 'Conflicting retry';end if;return jsonb_build_object('correct',old.correct,'replayed',true);end if;
 if s.status<>'active' then raise exception 'Session closed';end if;
 select * into i from public.activity_items where id=p_item and activity_id=s.activity_id and level=s.level;
 if i.id is null then raise exception 'Invalid item';end if;
 if p_answer is null or jsonb_typeof(p_answer)<>'array' or jsonb_array_length(p_answer)=0 or jsonb_array_length(p_answer)>4 then raise exception 'Invalid answer';end if;
 if exists(select 1 from jsonb_array_elements(p_answer) a where jsonb_typeof(a)<>'number' or not i.options @> jsonb_build_array(a)) then raise exception 'Invalid option';end if;
 select count(distinct item_id) into v_closed from public.responses where session_id=s.id and(correct or attempt_no=2);
 if i.ordinal<>v_closed+1 then raise exception 'Wrong item order';end if;
 select count(*) into v_count from public.responses where session_id=s.id and item_id=i.id;
 if p_attempt<>v_count+1 or p_hint is null then raise exception 'Invalid attempt';end if;
 if s.activity_id='race' then v_correct:=jsonb_array_length(p_answer)=2 and (select sum(value::integer) from jsonb_array_elements_text(p_answer))=(select sum(value::integer) from jsonb_array_elements_text(i.solution));else v_correct:=p_answer=i.solution;end if;
 insert into public.responses(session_id,item_id,answer,correct,hint_used,latency_ms,exposure_ms,attempt_no) values(p_session,p_item,p_answer,v_correct,p_hint,p_latency,p_exposure,p_attempt);
 return jsonb_build_object('correct',v_correct,'replayed',false);
end $$;
create function private.finish_play(p_session uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.play_sessions;v_closed integer;
begin
 select * into s from public.play_sessions where id=p_session for update;
 if s.id is null or auth.uid() is null or not exists(select 1 from public.child_profiles where id=s.profile_id and adult_id=auth.uid()) then raise exception 'Access denied';end if;
 if p_status not in('completed','interrupted') then raise exception 'Invalid status';end if;
 if s.status=p_status then return jsonb_build_object('id',s.id,'status',s.status,'replayed',true);end if;
 if s.status<>'active' then raise exception 'Session closed';end if;
 if p_status='completed' then select count(distinct item_id) into v_closed from public.responses where session_id=s.id and(correct or attempt_no=2);if v_closed<>5 then raise exception 'Incomplete session';end if;end if;
 update public.play_sessions set status=p_status,ended_at=now() where id=s.id;
 return jsonb_build_object('id',s.id,'status',p_status,'replayed',false);
end $$;
revoke all on function private.start_play(uuid,text),private.record_answer(uuid,text,jsonb,boolean,integer,integer,integer),private.finish_play(uuid,text) from public;
grant usage on schema private to authenticated;
grant execute on function private.start_play(uuid,text),private.record_answer(uuid,text,jsonb,boolean,integer,integer,integer),private.finish_play(uuid,text) to authenticated;
create function public.start_play(p_profile uuid,p_activity text) returns jsonb language sql security invoker set search_path='' as $$ select private.start_play(p_profile,p_activity) $$;
create function public.record_answer(p_session uuid,p_item text,p_answer jsonb,p_hint boolean,p_latency integer,p_exposure integer,p_attempt integer) returns jsonb language sql security invoker set search_path='' as $$ select private.record_answer(p_session,p_item,p_answer,p_hint,p_latency,p_exposure,p_attempt) $$;
create function public.finish_play(p_session uuid,p_status text) returns jsonb language sql security invoker set search_path='' as $$ select private.finish_play(p_session,p_status) $$;
revoke all on function public.start_play(uuid,text),public.record_answer(uuid,text,jsonb,boolean,integer,integer,integer),public.finish_play(uuid,text) from public;
grant execute on function public.start_play(uuid,text),public.record_answer(uuid,text,jsonb,boolean,integer,integer,integer),public.finish_play(uuid,text) to authenticated;
