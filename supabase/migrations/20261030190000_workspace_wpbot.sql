-- wpbot: the owner's assistant, visible only to the super admin.
-- Apply once in the Supabase SQL editor (or `supabase db push`). Do not reset the database.
-- This file does not delete rows. It adds a column, a bot table, one private channel, and tightens policies.
--
-- Super admin is not a new profiles.role. Regular admins stay role = 'admin'.
-- profiles.is_super_admin marks the owner (top-level admin). Clients cannot set it.
-- The migration turns the flag on for:
--   * arka.official021@gmail.com
--   * admin@arkasalehi.ir
--   * the admin who created the `arka` workspace tenant
-- If the owner uses another email, run this as postgres in the SQL editor (auth.uid() is null there):
--   update public.profiles set is_super_admin = true where lower(email) = 'you@example.com';

alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Signed-in clients cannot mint a super admin. Signup (auth.uid() is null) may.
    if auth.uid() is not null then
      new.is_super_admin := false;
    end if;
    if lower(coalesce(new.username, '')) = 'wpbot' then
      new.username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
    end if;
    return new;
  end if;

  if auth.uid() is not null then
    new.is_super_admin := old.is_super_admin;
  end if;
  if lower(coalesce(new.username, '')) = 'wpbot'
     and lower(coalesce(old.username, '')) is distinct from 'wpbot' then
    raise exception 'RESERVED';
  end if;
  if not public.is_admin() then
    new.role := old.role;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before insert or update on public.profiles
for each row execute function public.protect_profile_role();

-- SQL editor / migration: auth.uid() is null, so the flag can be set here.
update public.profiles
set is_super_admin = true
where lower(email) in ('arka.official021@gmail.com', 'admin@arkasalehi.ir');

update public.profiles p
set is_super_admin = true
from public.workspace_tenants t
where t.slug = 'arka'
  and t.created_by = p.id
  and lower(p.role) = 'admin';

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_super_admin is true
  );
$$;

revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.set_profile_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
  current_role text;
  target_owner boolean;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_role not in ('user', 'admin', 'collaborator') then
    raise exception 'INVALID_ROLE';
  end if;
  select role, is_super_admin into current_role, target_owner
  from public.profiles
  where id = p_user_id;
  if current_role is null then
    raise exception 'NOT_FOUND';
  end if;
  -- A regular admin cannot change the owner's role.
  if target_owner and not public.is_super_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if lower(current_role) = 'admin' and p_role <> 'admin' then
    select count(*) into admin_count from public.profiles where lower(role) = 'admin';
    if admin_count <= 1 then
      raise exception 'LAST_ADMIN';
    end if;
  end if;
  update public.profiles set role = p_role, updated_at = now() where id = p_user_id;
end;
$$;

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
  super_flag boolean := false;
begin
  uname := coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1));
  uname := lower(regexp_replace(uname, '[^a-zA-Z0-9._]', '', 'g'));
  if length(uname) < 3 then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if uname = 'wpbot' or exists (select 1 from public.profiles where username = uname) then
    uname := uname || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  dname := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), uname);

  select exists (select 1 from public.profiles where lower(role) = 'admin') into admin_exists;

  if not admin_exists and lower(new.email) in ('admin@arkasalehi.ir', 'arka.official021@gmail.com') then
    r := 'admin';
    super_flag := true;
  end if;

  insert into public.profiles (id, email, username, display_name, role, is_super_admin)
  values (new.id, new.email, uname, dname, r, super_flag)
  on conflict (id) do nothing;

  if r = 'admin' then
    perform public.seed_demo_content(new.id);
  end if;
  return new;
end;
$$;

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
      when lower(trim(p_username)) = 'wpbot' then true
      else exists (select 1 from public.profiles where username = lower(trim(p_username)))
    end
  );
$$;

-- Private bot channel. Kind `bot` is readable only by the super admin.
do $$
begin
  alter table public.workspace_channels drop constraint if exists workspace_channels_kind_check;
  alter table public.workspace_channels
    add constraint workspace_channels_kind_check
    check (kind in ('channel', 'group', 'private', 'dm', 'bot'));
exception when others then null;
end $$;

create or replace function public.can_access_channel(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_collaborator()
    and exists (
      select 1
      from public.workspace_channels c
      where c.id = p_channel_id
        and (
          (c.kind = 'bot' and public.is_super_admin())
          or (
            c.kind is distinct from 'bot'
            and (
              public.is_channel_member(p_channel_id)
              or (
                c.kind not in ('dm', 'private', 'group')
                and c.project_id is null
              )
              or (c.project_id is not null and public.can_see_project(c.project_id))
            )
          )
        )
    );
$$;

drop policy if exists "ws channels read" on public.workspace_channels;
create policy "ws channels read" on public.workspace_channels
  for select using (
    public.is_collaborator()
    and (
      (kind = 'bot' and public.is_super_admin())
      or (
        kind is distinct from 'bot'
        and (
          kind not in ('dm', 'private')
          or public.is_channel_member(id)
        )
      )
    )
  );

drop policy if exists "ws channels update" on public.workspace_channels;
create policy "ws channels update" on public.workspace_channels
  for update using (
    (kind = 'bot' and public.is_super_admin())
    or (
      kind is distinct from 'bot'
      and (
        public.is_admin()
        or (kind not in ('dm', 'private') and public.is_collaborator())
        or public.is_channel_member(id)
      )
    )
  )
  with check (
    (kind = 'bot' and public.is_super_admin())
    or (
      kind is distinct from 'bot'
      and (
        public.is_admin()
        or (kind not in ('dm', 'private') and public.is_collaborator())
        or public.is_channel_member(id)
      )
    )
  );

drop policy if exists "ws channels insert" on public.workspace_channels;
create policy "ws channels insert" on public.workspace_channels
  for insert with check (
    public.is_collaborator()
    and (kind is distinct from 'bot' or public.is_super_admin())
  );

insert into public.workspace_channels (slug, name, kind, tenant_id)
select 'wpbot', 'wpbot', 'bot', (select id from public.workspace_tenants where slug = 'arka' limit 1)
where not exists (select 1 from public.workspace_channels where slug = 'wpbot');

create table if not exists public.workspace_bots (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  kind text not null default 'bot' check (kind = 'bot'),
  visibility text not null default 'super_admin' check (visibility = 'super_admin'),
  channel_id uuid references public.workspace_channels(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.workspace_bots enable row level security;

drop policy if exists "wpbot super admin read" on public.workspace_bots;
create policy "wpbot super admin read" on public.workspace_bots
  for select using (visibility = 'super_admin' and public.is_super_admin());

revoke all on table public.workspace_bots from public, anon;
grant select on table public.workspace_bots to authenticated;

insert into public.workspace_bots (username, display_name, kind, visibility, channel_id)
select 'wpbot', 'wpbot', 'bot', 'super_admin', c.id
from (select 1) seed
left join public.workspace_channels c on c.slug = 'wpbot'
where not exists (select 1 from public.workspace_bots where username = 'wpbot');

create or replace function public.admin_list_profiles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'email', email,
      'username', username,
      'display_name', display_name,
      'role', role,
      'created_at', created_at
    ) order by created_at asc)
    from public.profiles
    where public.is_super_admin() or lower(username) is distinct from 'wpbot'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_visible_bots()
returns table (
  id uuid,
  username text,
  display_name text,
  channel_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.username, b.display_name, b.channel_id
  from public.workspace_bots b
  where public.is_super_admin()
    and b.visibility = 'super_admin';
$$;

revoke all on function public.list_visible_bots() from public, anon;
grant execute on function public.list_visible_bots() to authenticated;
