-- Multi-workspace, tracker projects, chat kinds, docs attachments, storage

create table if not exists public.workspace_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_tenant_members (
  tenant_id uuid not null references public.workspace_tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.workspace_tenants(id) on delete cascade,
  email text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.workspace_tenants(id) on delete cascade,
  name text not null,
  identifier text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_channel_members (
  channel_id uuid not null references public.workspace_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (channel_id, user_id)
);

alter table public.workspace_channels add column if not exists tenant_id uuid references public.workspace_tenants(id) on delete set null;
alter table public.workspace_messages add column if not exists file_url text;
alter table public.workspace_tasks add column if not exists tenant_id uuid references public.workspace_tenants(id) on delete set null;
alter table public.workspace_tasks add column if not exists project_id uuid references public.workspace_projects(id) on delete set null;
alter table public.workspace_tasks add column if not exists priority text not null default 'none';
alter table public.workspace_tasks add column if not exists labels text[] not null default '{}';
alter table public.workspace_notes add column if not exists tenant_id uuid references public.workspace_tenants(id) on delete set null;
alter table public.workspace_notes add column if not exists linked_task_id uuid references public.workspace_tasks(id) on delete set null;
alter table public.workspace_notes add column if not exists file_urls text[] not null default '{}';
alter table public.workspace_meetings add column if not exists tenant_id uuid references public.workspace_tenants(id) on delete set null;

do $$
begin
  alter table public.workspace_channels drop constraint if exists workspace_channels_kind_check;
  alter table public.workspace_channels
    add constraint workspace_channels_kind_check
    check (kind in ('channel', 'group', 'private', 'dm'));
exception when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workspace_tasks_priority_check') then
    alter table public.workspace_tasks
      add constraint workspace_tasks_priority_check
      check (priority in ('none', 'low', 'medium', 'high', 'urgent'));
  end if;
end $$;

insert into public.workspace_tenants (slug, name, created_by)
select 'arka', 'Arka', p.id
from public.profiles p
where lower(p.role::text) = 'admin'
  and not exists (select 1 from public.workspace_tenants)
order by p.created_at
limit 1;

insert into public.workspace_tenant_members (tenant_id, user_id, role)
select t.id, p.id, 'owner'
from public.workspace_tenants t
cross join public.profiles p
where lower(p.role::text) in ('admin', 'collaborator')
on conflict do nothing;

insert into public.workspace_projects (tenant_id, name, identifier, created_by)
select t.id, 'Studio', 'ARKA', t.created_by
from public.workspace_tenants t
where not exists (select 1 from public.workspace_projects);

update public.workspace_channels c
set tenant_id = t.id
from public.workspace_tenants t
where c.tenant_id is null;

alter table public.workspace_tenants enable row level security;
alter table public.workspace_tenant_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.workspace_projects enable row level security;
alter table public.workspace_channel_members enable row level security;

drop policy if exists "ws tenants read" on public.workspace_tenants;
create policy "ws tenants read" on public.workspace_tenants for select using (public.is_collaborator());
drop policy if exists "ws tenants write" on public.workspace_tenants;
create policy "ws tenants write" on public.workspace_tenants for all using (public.is_collaborator()) with check (public.is_collaborator());

drop policy if exists "ws tenant members read" on public.workspace_tenant_members;
create policy "ws tenant members read" on public.workspace_tenant_members for select using (public.is_collaborator());
drop policy if exists "ws tenant members write" on public.workspace_tenant_members;
create policy "ws tenant members write" on public.workspace_tenant_members for all using (public.is_collaborator()) with check (public.is_collaborator());

drop policy if exists "ws invites read" on public.workspace_invites;
create policy "ws invites read" on public.workspace_invites for select using (public.is_collaborator());
drop policy if exists "ws invites write" on public.workspace_invites;
create policy "ws invites write" on public.workspace_invites for all using (public.is_collaborator()) with check (public.is_collaborator());

drop policy if exists "ws projects read" on public.workspace_projects;
create policy "ws projects read" on public.workspace_projects for select using (public.is_collaborator());
drop policy if exists "ws projects write" on public.workspace_projects;
create policy "ws projects write" on public.workspace_projects for all using (public.is_collaborator()) with check (public.is_collaborator());

drop policy if exists "ws channel members read" on public.workspace_channel_members;
create policy "ws channel members read" on public.workspace_channel_members for select using (public.is_collaborator());
drop policy if exists "ws channel members write" on public.workspace_channel_members;
create policy "ws channel members write" on public.workspace_channel_members for all using (public.is_collaborator()) with check (public.is_collaborator());

drop policy if exists "ws channels write admin" on public.workspace_channels;
drop policy if exists "ws channels insert" on public.workspace_channels;
create policy "ws channels insert" on public.workspace_channels
  for insert with check (public.is_collaborator());
drop policy if exists "ws channels update" on public.workspace_channels;
create policy "ws channels update" on public.workspace_channels
  for update using (public.is_collaborator()) with check (public.is_collaborator());

grant select, insert, update, delete on public.workspace_tenants to authenticated;
grant select, insert, update, delete on public.workspace_tenant_members to authenticated;
grant select, insert, update, delete on public.workspace_invites to authenticated;
grant select, insert, update, delete on public.workspace_projects to authenticated;
grant select, insert, update, delete on public.workspace_channel_members to authenticated;
grant select, insert, update on public.workspace_channels to authenticated;

insert into storage.buckets (id, name, public)
values ('workspace', 'workspace', true)
on conflict (id) do nothing;

drop policy if exists "ws storage read" on storage.objects;
create policy "ws storage read" on storage.objects
  for select using (bucket_id = 'workspace');
drop policy if exists "ws storage insert" on storage.objects;
create policy "ws storage insert" on storage.objects
  for insert with check (bucket_id = 'workspace' and public.is_collaborator());
drop policy if exists "ws storage update" on storage.objects;
create policy "ws storage update" on storage.objects
  for update using (bucket_id = 'workspace' and public.is_collaborator()) with check (bucket_id = 'workspace' and public.is_collaborator());
