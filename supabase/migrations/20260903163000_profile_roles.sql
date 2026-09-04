-- Role column as text: 'user' | 'admin'. Converts legacy enum USER/ADMIN if present.
-- Promotes arka.official021@gmail.com to admin.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and lower(role::text) = 'admin'
  );
$$;

do $$ begin
  alter table public.profiles disable trigger profiles_protect_role;
exception when undefined_object then
  null;
end $$;

do $$
declare
  role_udt text;
begin
  select t.typname
  into role_udt
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  where n.nspname = 'public'
    and c.relname = 'profiles'
    and a.attname = 'role'
    and not a.attisdropped;

  if role_udt is null then
    alter table public.profiles add column role text not null default 'user';
  elsif role_udt = 'user_role' then
    alter table public.profiles alter column role drop default;
    alter table public.profiles
      alter column role type text using (
        case when role::text in ('ADMIN', 'admin') then 'admin' else 'user' end
      );
    alter table public.profiles alter column role set default 'user';
    alter table public.profiles alter column role set not null;
  else
    update public.profiles
    set role = case when lower(role::text) = 'admin' then 'admin' else 'user' end
    where role is distinct from case when lower(role::text) = 'admin' then 'admin' else 'user' end;
    alter table public.profiles alter column role set default 'user';
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
  r text;
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
  r := case
    when lower(new.email) in ('admin@arkasalehi.ir', 'arka.official021@gmail.com') then 'admin'
    else 'user'
  end;

  insert into public.profiles (id, email, username, display_name, role)
  values (new.id, new.email, uname, dname, r)
  on conflict (id) do nothing;

  if r = 'admin' then
    perform public.seed_demo_content(new.id);
  end if;
  return new;
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

update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'arka.official021@gmail.com';

update public.profiles
set role = 'admin'
where lower(email) = 'arka.official021@gmail.com';

do $$ begin
  alter table public.profiles enable trigger profiles_protect_role;
exception when undefined_object then
  null;
end $$;

do $$ begin
  drop type if exists public.user_role;
exception when others then
  null;
end $$;
