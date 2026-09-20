-- Collaborator role + workspace (chat, meetings, tasks)

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'collaborator'));

create or replace function public.is_collaborator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and lower(role::text) in ('collaborator', 'admin')
  );
$$;
grant execute on function public.is_collaborator() to anon, authenticated;

create or replace function public.set_profile_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
  current_role text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_role not in ('user', 'admin', 'collaborator') then
    raise exception 'INVALID_ROLE';
  end if;
  select role into current_role from public.profiles where id = p_user_id;
  if current_role is null then
    raise exception 'NOT_FOUND';
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
grant execute on function public.set_profile_role(uuid, text) to authenticated;

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
  ), '[]'::jsonb);
end;
$$;
grant execute on function public.admin_list_profiles() to authenticated;

create table if not exists public.workspace_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'channel' check (kind in ('channel', 'group')),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.workspace_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists workspace_messages_channel_created_idx
  on public.workspace_messages (channel_id, created_at desc);

create table if not exists public.workspace_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  room_name text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  sort int not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.workspace_channels enable row level security;
alter table public.workspace_messages enable row level security;
alter table public.workspace_meetings enable row level security;
alter table public.workspace_tasks enable row level security;

drop policy if exists "ws channels read" on public.workspace_channels;
create policy "ws channels read" on public.workspace_channels
  for select using (public.is_collaborator());

drop policy if exists "ws channels write admin" on public.workspace_channels;
create policy "ws channels write admin" on public.workspace_channels
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ws messages read" on public.workspace_messages;
create policy "ws messages read" on public.workspace_messages
  for select using (public.is_collaborator());
drop policy if exists "ws messages insert" on public.workspace_messages;
create policy "ws messages insert" on public.workspace_messages
  for insert with check (public.is_collaborator() and user_id = auth.uid());
drop policy if exists "ws messages delete own" on public.workspace_messages;
create policy "ws messages delete own" on public.workspace_messages
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ws meetings read" on public.workspace_meetings;
create policy "ws meetings read" on public.workspace_meetings
  for select using (public.is_collaborator());
drop policy if exists "ws meetings insert" on public.workspace_meetings;
create policy "ws meetings insert" on public.workspace_meetings
  for insert with check (public.is_collaborator() and created_by = auth.uid());
drop policy if exists "ws meetings update" on public.workspace_meetings;
create policy "ws meetings update" on public.workspace_meetings
  for update using (public.is_collaborator()) with check (public.is_collaborator());
drop policy if exists "ws meetings delete" on public.workspace_meetings;
create policy "ws meetings delete" on public.workspace_meetings
  for delete using (created_by = auth.uid() or public.is_admin());

drop policy if exists "ws tasks read" on public.workspace_tasks;
create policy "ws tasks read" on public.workspace_tasks
  for select using (public.is_collaborator());
drop policy if exists "ws tasks insert" on public.workspace_tasks;
create policy "ws tasks insert" on public.workspace_tasks
  for insert with check (public.is_collaborator() and created_by = auth.uid());
drop policy if exists "ws tasks update" on public.workspace_tasks;
create policy "ws tasks update" on public.workspace_tasks
  for update using (public.is_collaborator()) with check (public.is_collaborator());
drop policy if exists "ws tasks delete" on public.workspace_tasks;
create policy "ws tasks delete" on public.workspace_tasks
  for delete using (created_by = auth.uid() or public.is_admin());

grant select on public.workspace_channels to authenticated;
grant select, insert, delete on public.workspace_messages to authenticated;
grant select, insert, update, delete on public.workspace_meetings to authenticated;
grant select, insert, update, delete on public.workspace_tasks to authenticated;

insert into public.workspace_channels (slug, name, kind) values
  ('general', 'عمومی', 'channel'),
  ('meeting-space', 'اتاق جلسه', 'channel'),
  ('design', 'طراحی', 'channel')
on conflict (slug) do nothing;

alter table public.workspace_messages replica identity full;
alter table public.workspace_tasks replica identity full;
alter table public.workspace_meetings replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.workspace_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_tasks;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_meetings;
  exception when duplicate_object then null;
  end;
end $$;
