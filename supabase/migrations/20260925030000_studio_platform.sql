-- Studio platform: projects, members, rooms, calendar, files, notices

alter table public.workspace_projects add column if not exists description text not null default '';
alter table public.workspace_projects add column if not exists status text not null default 'active';
alter table public.workspace_projects add column if not exists manager_id uuid references public.profiles(id) on delete set null;
alter table public.workspace_projects add column if not exists channel_id uuid references public.workspace_channels(id) on delete set null;
alter table public.workspace_projects add column if not exists meeting_id uuid references public.workspace_meetings(id) on delete set null;
alter table public.workspace_projects add column if not exists board_id uuid references public.workspace_notes(id) on delete set null;
alter table public.workspace_projects add column if not exists tv_kind text;
alter table public.workspace_projects add column if not exists tv_url text;
alter table public.workspace_projects add column if not exists tv_title text;

do $$
begin
  alter table public.workspace_projects drop constraint if exists workspace_projects_status_check;
  alter table public.workspace_projects
    add constraint workspace_projects_status_check
    check (status in ('active', 'locked', 'inactive'));
exception when others then null;
end $$;

alter table public.workspace_channels add column if not exists project_id uuid references public.workspace_projects(id) on delete cascade;
alter table public.workspace_notes add column if not exists project_id uuid references public.workspace_projects(id) on delete cascade;
alter table public.workspace_meetings add column if not exists kind text not null default 'project';
alter table public.workspace_meetings add column if not exists project_id uuid references public.workspace_projects(id) on delete cascade;
alter table public.workspace_meetings add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.workspace_meetings add column if not exists is_open boolean not null default false;

do $$
begin
  alter table public.workspace_meetings drop constraint if exists workspace_meetings_kind_check;
  alter table public.workspace_meetings
    add constraint workspace_meetings_kind_check
    check (kind in ('project', 'personal'));
exception when others then null;
end $$;

create table if not exists public.workspace_project_members (
  project_id uuid not null references public.workspace_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('manager', 'member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.workspace_task_assignees (
  task_id uuid not null references public.workspace_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists public.workspace_task_extensions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.workspace_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  extra_hours int not null check (extra_hours > 0 and extra_hours <= 720),
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  decided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.workspace_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  notify_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.workspace_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  url text not null,
  mime text not null default '',
  size_bytes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_join_requests (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.workspace_meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (meeting_id, user_id)
);

create table if not exists public.workspace_call_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.workspace_meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

create table if not exists public.workspace_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen timestamptz not null default now()
);

create table if not exists public.workspace_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists workspace_project_members_user_idx on public.workspace_project_members (user_id);
create index if not exists workspace_task_assignees_user_idx on public.workspace_task_assignees (user_id);
create index if not exists workspace_project_files_project_idx on public.workspace_project_files (project_id, created_at desc);
create index if not exists workspace_notices_user_idx on public.workspace_notices (user_id, created_at desc);
create index if not exists workspace_join_requests_meeting_idx on public.workspace_join_requests (meeting_id, status);
create unique index if not exists workspace_meetings_personal_owner_idx
  on public.workspace_meetings (owner_id) where kind = 'personal';
create unique index if not exists workspace_channels_project_idx
  on public.workspace_channels (project_id) where project_id is not null;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.workspace_project_members m
    where m.project_id = p_project_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.project_is_active(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_projects p
    where p.id = p_project_id and p.status = 'active'
  );
$$;

create or replace function public.can_see_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or (
    public.is_project_member(p_project_id)
    and exists (
      select 1 from public.workspace_projects p
      where p.id = p_project_id and p.status <> 'inactive'
    )
  );
$$;

create or replace function public.project_is_writable(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or (
    public.is_project_member(p_project_id) and public.project_is_active(p_project_id)
  );
$$;

grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.project_is_active(uuid) to authenticated;
grant execute on function public.can_see_project(uuid) to authenticated;
grant execute on function public.project_is_writable(uuid) to authenticated;

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
          public.is_channel_member(p_channel_id)
          or (
            c.kind not in ('dm', 'private', 'group')
            and c.project_id is null
          )
          or (c.project_id is not null and public.can_see_project(c.project_id))
        )
    );
$$;

create or replace function public.can_join_meeting(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_meetings m
    where m.id = p_meeting_id
      and public.is_collaborator()
      and (
        public.is_admin()
        or (m.kind = 'personal' and m.owner_id = auth.uid())
        or (
          m.kind = 'personal'
          and m.is_open
          and exists (
            select 1 from public.workspace_join_requests r
            where r.meeting_id = m.id and r.user_id = auth.uid() and r.status = 'approved'
          )
        )
        or (
          m.kind = 'project'
          and m.project_id is not null
          and public.can_see_project(m.project_id)
          and public.project_is_active(m.project_id)
        )
      )
  );
$$;

grant execute on function public.can_join_meeting(uuid) to authenticated;

alter table public.workspace_project_members enable row level security;
alter table public.workspace_task_assignees enable row level security;
alter table public.workspace_task_extensions enable row level security;
alter table public.workspace_calendar_events enable row level security;
alter table public.workspace_project_files enable row level security;
alter table public.workspace_join_requests enable row level security;
alter table public.workspace_call_sessions enable row level security;
alter table public.workspace_presence enable row level security;
alter table public.workspace_notices enable row level security;

drop policy if exists "ws projects read" on public.workspace_projects;
create policy "ws projects read" on public.workspace_projects
  for select using (public.can_see_project(id));
drop policy if exists "ws projects write" on public.workspace_projects;
drop policy if exists "ws projects insert" on public.workspace_projects;
create policy "ws projects insert" on public.workspace_projects
  for insert with check (public.is_admin());
drop policy if exists "ws projects update" on public.workspace_projects;
create policy "ws projects update" on public.workspace_projects
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ws projects delete" on public.workspace_projects;
create policy "ws projects delete" on public.workspace_projects
  for delete using (public.is_admin());

drop policy if exists "ws project members read" on public.workspace_project_members;
create policy "ws project members read" on public.workspace_project_members
  for select using (public.can_see_project(project_id));
drop policy if exists "ws project members write" on public.workspace_project_members;
create policy "ws project members write" on public.workspace_project_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ws tasks read" on public.workspace_tasks;
create policy "ws tasks read" on public.workspace_tasks
  for select using (
    public.is_admin()
    or (project_id is not null and public.can_see_project(project_id))
    or created_by = auth.uid()
    or assignee_id = auth.uid()
    or exists (select 1 from public.workspace_task_assignees a where a.task_id = id and a.user_id = auth.uid())
  );
drop policy if exists "ws tasks insert" on public.workspace_tasks;
create policy "ws tasks insert" on public.workspace_tasks
  for insert with check (
    created_by = auth.uid()
    and (project_id is null or public.project_is_writable(project_id) or public.is_admin())
  );
drop policy if exists "ws tasks update" on public.workspace_tasks;
create policy "ws tasks update" on public.workspace_tasks
  for update using (
    public.is_admin()
    or (project_id is not null and public.project_is_writable(project_id))
    or assignee_id = auth.uid()
    or exists (select 1 from public.workspace_task_assignees a where a.task_id = id and a.user_id = auth.uid())
  );
drop policy if exists "ws tasks delete" on public.workspace_tasks;
create policy "ws tasks delete" on public.workspace_tasks
  for delete using (public.is_admin() or created_by = auth.uid());

drop policy if exists "ws task assignees read" on public.workspace_task_assignees;
create policy "ws task assignees read" on public.workspace_task_assignees
  for select using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.workspace_tasks t
      where t.id = task_id and (t.project_id is null or public.can_see_project(t.project_id))
    )
  );
drop policy if exists "ws task assignees write" on public.workspace_task_assignees;
create policy "ws task assignees write" on public.workspace_task_assignees
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.workspace_tasks t
      where t.id = task_id and t.project_id is not null and public.project_is_writable(t.project_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.workspace_tasks t
      where t.id = task_id and t.project_id is not null and public.project_is_writable(t.project_id)
    )
  );

drop policy if exists "ws task extensions read" on public.workspace_task_extensions;
create policy "ws task extensions read" on public.workspace_task_extensions
  for select using (public.is_admin() or user_id = auth.uid());
drop policy if exists "ws task extensions insert" on public.workspace_task_extensions;
create policy "ws task extensions insert" on public.workspace_task_extensions
  for insert with check (user_id = auth.uid());
drop policy if exists "ws task extensions update" on public.workspace_task_extensions;
create policy "ws task extensions update" on public.workspace_task_extensions
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ws events read" on public.workspace_calendar_events;
create policy "ws events read" on public.workspace_calendar_events
  for select using (public.is_collaborator());
drop policy if exists "ws events write" on public.workspace_calendar_events;
create policy "ws events write" on public.workspace_calendar_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ws project files read" on public.workspace_project_files;
create policy "ws project files read" on public.workspace_project_files
  for select using (public.can_see_project(project_id));
drop policy if exists "ws project files insert" on public.workspace_project_files;
create policy "ws project files insert" on public.workspace_project_files
  for insert with check (user_id = auth.uid() and public.project_is_writable(project_id));
drop policy if exists "ws project files delete" on public.workspace_project_files;
create policy "ws project files delete" on public.workspace_project_files
  for delete using (public.is_admin() or user_id = auth.uid());

drop policy if exists "ws meetings read" on public.workspace_meetings;
create policy "ws meetings read" on public.workspace_meetings
  for select using (
    public.is_collaborator() and (
      public.is_admin()
      or (kind = 'personal' and (owner_id = auth.uid() or is_open))
      or (kind = 'project' and project_id is not null and public.can_see_project(project_id))
    )
  );
drop policy if exists "ws meetings insert" on public.workspace_meetings;
create policy "ws meetings insert" on public.workspace_meetings
  for insert with check (public.is_admin() or (kind = 'personal' and owner_id = auth.uid() and created_by = auth.uid()));
drop policy if exists "ws meetings update" on public.workspace_meetings;
create policy "ws meetings update" on public.workspace_meetings
  for update using (public.is_admin() or owner_id = auth.uid())
  with check (public.is_admin() or owner_id = auth.uid());
drop policy if exists "ws meetings delete" on public.workspace_meetings;
create policy "ws meetings delete" on public.workspace_meetings
  for delete using (public.is_admin());

drop policy if exists "ws join requests read" on public.workspace_join_requests;
create policy "ws join requests read" on public.workspace_join_requests
  for select using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (select 1 from public.workspace_meetings m where m.id = meeting_id and m.owner_id = auth.uid())
  );
drop policy if exists "ws join requests insert" on public.workspace_join_requests;
create policy "ws join requests insert" on public.workspace_join_requests
  for insert with check (user_id = auth.uid());
drop policy if exists "ws join requests update" on public.workspace_join_requests;
create policy "ws join requests update" on public.workspace_join_requests
  for update using (
    public.is_admin()
    or exists (select 1 from public.workspace_meetings m where m.id = meeting_id and m.owner_id = auth.uid())
  );

drop policy if exists "ws call sessions read" on public.workspace_call_sessions;
create policy "ws call sessions read" on public.workspace_call_sessions
  for select using (public.is_collaborator());
drop policy if exists "ws call sessions insert" on public.workspace_call_sessions;
create policy "ws call sessions insert" on public.workspace_call_sessions
  for insert with check (user_id = auth.uid() and public.can_join_meeting(meeting_id));
drop policy if exists "ws call sessions update" on public.workspace_call_sessions;
create policy "ws call sessions update" on public.workspace_call_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ws presence read" on public.workspace_presence;
create policy "ws presence read" on public.workspace_presence
  for select using (public.is_collaborator());
drop policy if exists "ws presence write" on public.workspace_presence;
create policy "ws presence write" on public.workspace_presence
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ws notices read" on public.workspace_notices;
create policy "ws notices read" on public.workspace_notices
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "ws notices insert" on public.workspace_notices;
create policy "ws notices insert" on public.workspace_notices
  for insert with check (public.is_collaborator());
drop policy if exists "ws notices update" on public.workspace_notices;
create policy "ws notices update" on public.workspace_notices
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ws notes read" on public.workspace_notes;
create policy "ws notes read" on public.workspace_notes
  for select using (
    public.is_admin()
    or project_id is null
    or public.can_see_project(project_id)
  );
drop policy if exists "ws notes insert" on public.workspace_notes;
create policy "ws notes insert" on public.workspace_notes
  for insert with check (
    created_by = auth.uid()
    and (project_id is null or public.project_is_writable(project_id))
  );
drop policy if exists "ws notes update" on public.workspace_notes;
create policy "ws notes update" on public.workspace_notes
  for update using (
    public.is_admin()
    or created_by = auth.uid()
    or (project_id is not null and public.project_is_writable(project_id))
  );

grant select, insert, update, delete on public.workspace_project_members to authenticated;
grant select, insert, update, delete on public.workspace_task_assignees to authenticated;
grant select, insert, update on public.workspace_task_extensions to authenticated;
grant select, insert, update, delete on public.workspace_calendar_events to authenticated;
grant select, insert, delete on public.workspace_project_files to authenticated;
grant select, insert, update on public.workspace_join_requests to authenticated;
grant select, insert, update on public.workspace_call_sessions to authenticated;
grant select, insert, update on public.workspace_presence to authenticated;
grant select, insert, update on public.workspace_notices to authenticated;

-- Replace ad-hoc rooms with project + personal rooms
delete from public.workspace_meetings;

insert into public.workspace_project_members (project_id, user_id, role)
select p.id, m.user_id, case when lower(pr.role) = 'admin' then 'manager' else 'member' end
from public.workspace_projects p
join public.workspace_tenant_members m on m.tenant_id = p.tenant_id
join public.profiles pr on pr.id = m.user_id
on conflict do nothing;

insert into public.workspace_channels (slug, name, kind, tenant_id, project_id)
select
  'prj-' || substr(replace(p.id::text, '-', ''), 1, 12),
  p.name,
  'group',
  p.tenant_id,
  p.id
from public.workspace_projects p
where p.channel_id is null
  and not exists (select 1 from public.workspace_channels c where c.project_id = p.id);

insert into public.workspace_channel_members (channel_id, user_id)
select c.id, m.user_id
from public.workspace_channels c
join public.workspace_project_members m on m.project_id = c.project_id
where c.project_id is not null
on conflict do nothing;

insert into public.workspace_meetings (title, starts_at, room_name, created_by, tenant_id, kind, project_id, is_open)
select
  p.name,
  now(),
  'prj-' || substr(replace(p.id::text, '-', ''), 1, 12),
  p.created_by,
  p.tenant_id,
  'project',
  p.id,
  true
from public.workspace_projects p
where p.meeting_id is null
  and not exists (select 1 from public.workspace_meetings m where m.project_id = p.id);

insert into public.workspace_notes (title, color, created_by, body, tenant_id, project_id)
select
  p.name,
  'lilac',
  p.created_by,
  '',
  p.tenant_id,
  p.id
from public.workspace_projects p
where p.board_id is null
  and not exists (select 1 from public.workspace_notes n where n.project_id = p.id);

update public.workspace_projects p
set
  channel_id = c.id,
  meeting_id = m.id,
  board_id = n.id,
  manager_id = coalesce(p.manager_id, p.created_by)
from public.workspace_channels c, public.workspace_meetings m, public.workspace_notes n
where c.project_id = p.id
  and m.project_id = p.id
  and n.project_id = p.id;

insert into public.workspace_meetings (title, starts_at, room_name, created_by, tenant_id, kind, owner_id, is_open)
select
  coalesce(nullif(pr.display_name, ''), pr.username, 'Room'),
  now(),
  'me-' || substr(replace(pr.id::text, '-', ''), 1, 12),
  pr.id,
  t.id,
  'personal',
  pr.id,
  false
from public.profiles pr
join public.workspace_tenants t on true
where lower(pr.role) in ('admin', 'collaborator')
  and not exists (select 1 from public.workspace_meetings m where m.kind = 'personal' and m.owner_id = pr.id);

alter table public.workspace_notices replica identity full;
alter table public.workspace_join_requests replica identity full;
alter table public.workspace_tasks replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.workspace_notices;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_join_requests;
  exception when duplicate_object then null;
  end;
end $$;
