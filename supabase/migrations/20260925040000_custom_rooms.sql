-- Dedicated rooms, meeting allowlists, project chat backfill

alter table public.workspace_meetings drop constraint if exists workspace_meetings_kind_check;
alter table public.workspace_meetings
  add constraint workspace_meetings_kind_check
  check (kind in ('project', 'personal', 'custom'));

create table if not exists public.workspace_meeting_members (
  meeting_id uuid not null references public.workspace_meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create index if not exists workspace_meeting_members_user_idx on public.workspace_meeting_members (user_id);

alter table public.workspace_meeting_members enable row level security;

create or replace function public.is_meeting_member(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.workspace_meeting_members m
    where m.meeting_id = p_meeting_id and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_meeting_member(uuid) to authenticated;

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
          and m.is_open
          and m.project_id is not null
          and public.can_see_project(m.project_id)
          and public.project_is_active(m.project_id)
        )
        or (
          m.kind = 'custom'
          and m.is_open
          and public.is_meeting_member(m.id)
        )
      )
  );
$$;

drop policy if exists "ws meeting members read" on public.workspace_meeting_members;
create policy "ws meeting members read" on public.workspace_meeting_members
  for select using (public.is_admin() or user_id = auth.uid() or public.is_meeting_member(meeting_id));
drop policy if exists "ws meeting members write" on public.workspace_meeting_members;
create policy "ws meeting members write" on public.workspace_meeting_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ws meetings read" on public.workspace_meetings;
create policy "ws meetings read" on public.workspace_meetings
  for select using (
    public.is_collaborator() and (
      public.is_admin()
      or (kind = 'personal' and (owner_id = auth.uid() or is_open))
      or (kind = 'project' and project_id is not null and public.can_see_project(project_id))
      or (kind = 'custom' and public.is_meeting_member(id))
    )
  );

grant select, insert, update, delete on public.workspace_meeting_members to authenticated;

insert into public.workspace_channels (slug, name, kind, tenant_id, project_id)
select
  'prj-' || substr(replace(p.id::text, '-', ''), 1, 12),
  p.name,
  'group',
  p.tenant_id,
  p.id
from public.workspace_projects p
where not exists (select 1 from public.workspace_channels c where c.project_id = p.id);

update public.workspace_projects p
set channel_id = c.id
from public.workspace_channels c
where c.project_id = p.id and (p.channel_id is null or p.channel_id <> c.id);

insert into public.workspace_channel_members (channel_id, user_id)
select c.id, m.user_id
from public.workspace_channels c
join public.workspace_project_members m on m.project_id = c.project_id
where c.project_id is not null
on conflict do nothing;
