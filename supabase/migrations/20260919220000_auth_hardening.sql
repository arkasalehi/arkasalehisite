-- Auth hardening: no auto-admin after first admin exists, lock notify RPCs,
-- hide profile emails/roles from public REST, private bookmarks, durable rate limit.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
  r text := 'user';
  admin_exists boolean;
begin
  uname := coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1));
  uname := lower(regexp_replace(uname, '[^a-zA-Z0-9._]', '', 'g'));
  if length(uname) < 3 then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  dname := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), uname);

  select exists (select 1 from public.profiles where lower(role) = 'admin') into admin_exists;

  if not admin_exists and lower(new.email) in ('admin@arkasalehi.ir', 'arka.official021@gmail.com') then
    r := 'admin';
  end if;

  insert into public.profiles (id, email, username, display_name, role)
  values (new.id, new.email, uname, dname, r)
  on conflict (id) do nothing;

  if r = 'admin' then
    perform public.seed_demo_content(new.id);
  end if;
  return new;
end;
$$;

create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_actor_id uuid default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and p_actor_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN';
  end if;
  if p_user_id = p_actor_id then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, link, actor_id, post_id)
  values (p_user_id, p_type, p_title, p_body, p_link, p_actor_id, p_post_id);
end;
$$;

create or replace function public.notify_admins(
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_actor_id uuid default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
  existing public.notifications%rowtype;
  gkey text;
  next_count int;
  next_title text;
begin
  if auth.uid() is not null
     and not public.is_admin()
     and p_actor_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN';
  end if;
  gkey := case when p_post_id is not null then p_type::text || ':' || p_post_id::text else null end;
  for admin_row in select id from public.profiles where lower(role::text) = 'admin' loop
    if gkey is not null and p_type in ('LIKE', 'COMMENT') then
      select * into existing
      from public.notifications
      where user_id = admin_row.id and group_key = gkey and read = false
      order by created_at desc
      limit 1;
      if found then
        next_count := existing.count + 1;
        next_title := case
          when p_type = 'LIKE' then next_count::text || ' نفر این مطلب را پسندیدند'
          else next_count::text || ' نظر تازه روی مطلب'
        end;
        update public.notifications
        set count = next_count, title = next_title, body = p_body, created_at = now()
        where id = existing.id;
        continue;
      end if;
    end if;
    insert into public.notifications (user_id, type, title, body, link, actor_id, post_id, group_key)
    values (admin_row.id, p_type, p_title, p_body, p_link, p_actor_id, p_post_id, gkey);
  end loop;
end;
$$;

create or replace function public.notify_all_users(
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  insert into public.notifications (user_id, type, title, body, link, post_id)
  select id, p_type, p_title, p_body, p_link, p_post_id from public.profiles;
end;
$$;

revoke execute on function public.notify_all_users(public.notification_type, text, text, text, uuid) from public, anon;
grant execute on function public.notify_all_users(public.notification_type, text, text, text, uuid) to authenticated;

revoke select on table public.profiles from anon, authenticated;
grant select (id, username, display_name, avatar_url, bio) on table public.profiles to anon, authenticated;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read public cards" on public.profiles
  for select using (true);
drop policy if exists "profiles read own full" on public.profiles;
-- own/admin updates stay; full row (email/role) is only via my_profile()

create or replace function public.my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p) from public.profiles p where p.id = auth.uid();
$$;
grant execute on function public.my_profile() to authenticated;

create or replace function public.identifier_taken(p_email text, p_username text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'email', exists (select 1 from public.profiles where lower(email) = lower(trim(p_email))),
    'username', case
      when p_username is null or length(trim(p_username)) = 0 then false
      else exists (select 1 from public.profiles where username = lower(trim(p_username)))
    end
  );
$$;
grant execute on function public.identifier_taken(text, text) to anon, authenticated;

drop policy if exists "bookmarks read" on public.bookmarks;
drop policy if exists "bookmarks read own" on public.bookmarks;
create policy "bookmarks read own" on public.bookmarks
  for select using (auth.uid() = user_id or public.is_admin());

alter table public.posts add column if not exists bookmark_count int not null default 0;

update public.posts p
set bookmark_count = coalesce((select count(*) from public.bookmarks b where b.post_id = p.id), 0);

create or replace function public.sync_bookmark_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set bookmark_count = bookmark_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set bookmark_count = greatest(0, bookmark_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists bookmarks_count_ins on public.bookmarks;
drop trigger if exists bookmarks_count_del on public.bookmarks;
create trigger bookmarks_count_ins after insert on public.bookmarks
  for each row execute function public.sync_bookmark_count();
create trigger bookmarks_count_del after delete on public.bookmarks
  for each row execute function public.sync_bookmark_count();

create table if not exists public.auth_rate_limits (
  key text primary key,
  hits int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.auth_rate_limits enable row level security;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.auth_rate_limits%rowtype;
  now_ts timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) < 4 or length(p_key) > 180 then
    return false;
  end if;
  if p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  loop
    select * into rec from public.auth_rate_limits where key = p_key for update;
    if not found then
      begin
        insert into public.auth_rate_limits(key, hits, window_start) values (p_key, 1, now_ts);
        return true;
      exception when unique_violation then
        continue;
      end;
    end if;
    if rec.window_start + make_interval(secs => p_window_seconds) < now_ts then
      update public.auth_rate_limits set hits = 1, window_start = now_ts where key = p_key;
      return true;
    end if;
    if rec.hits >= p_limit then
      return false;
    end if;
    update public.auth_rate_limits set hits = hits + 1 where key = p_key;
    return true;
  end loop;
end;
$$;
grant execute on function public.hit_rate_limit(text, int, int) to anon, authenticated;

revoke all on table public.auth_rate_limits from anon, authenticated;
