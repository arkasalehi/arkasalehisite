alter table public.workspace_messages
  add column if not exists reply_to uuid references public.workspace_messages(id) on delete set null,
  add column if not exists kind text not null default 'text',
  add column if not exists file_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspace_messages_kind_check'
  ) then
    alter table public.workspace_messages
      add constraint workspace_messages_kind_check
      check (kind in ('text', 'file', 'voice'));
  end if;
end $$;

create index if not exists workspace_messages_reply_idx on public.workspace_messages (reply_to);

alter table public.workspace_tasks
  add column if not exists description text,
  add column if not exists parent_id uuid references public.workspace_tasks(id) on delete cascade;

create table if not exists public.workspace_reactions (
  message_id uuid not null references public.workspace_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.workspace_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  color text not null default 'lilac',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.workspace_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists workspace_task_comments_task_idx
  on public.workspace_task_comments (task_id, created_at desc);

alter table public.workspace_reactions enable row level security;
alter table public.workspace_notes enable row level security;
alter table public.workspace_task_comments enable row level security;

drop policy if exists "ws reactions read" on public.workspace_reactions;
create policy "ws reactions read" on public.workspace_reactions
  for select using (public.is_collaborator());
drop policy if exists "ws reactions write" on public.workspace_reactions;
create policy "ws reactions write" on public.workspace_reactions
  for insert with check (public.is_collaborator() and user_id = auth.uid());
drop policy if exists "ws reactions delete" on public.workspace_reactions;
create policy "ws reactions delete" on public.workspace_reactions
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ws notes read" on public.workspace_notes;
create policy "ws notes read" on public.workspace_notes
  for select using (public.is_collaborator());
drop policy if exists "ws notes insert" on public.workspace_notes;
create policy "ws notes insert" on public.workspace_notes
  for insert with check (public.is_collaborator() and created_by = auth.uid());
drop policy if exists "ws notes delete" on public.workspace_notes;
create policy "ws notes delete" on public.workspace_notes
  for delete using (created_by = auth.uid() or public.is_admin());

drop policy if exists "ws task comments read" on public.workspace_task_comments;
create policy "ws task comments read" on public.workspace_task_comments
  for select using (public.is_collaborator());
drop policy if exists "ws task comments insert" on public.workspace_task_comments;
create policy "ws task comments insert" on public.workspace_task_comments
  for insert with check (public.is_collaborator() and user_id = auth.uid());
drop policy if exists "ws task comments delete" on public.workspace_task_comments;
create policy "ws task comments delete" on public.workspace_task_comments
  for delete using (user_id = auth.uid() or public.is_admin());

grant select, insert, delete on public.workspace_reactions to authenticated;
grant select, insert, delete on public.workspace_notes to authenticated;
grant select, insert, delete on public.workspace_task_comments to authenticated;

alter table public.workspace_reactions replica identity full;
alter table public.workspace_notes replica identity full;
alter table public.workspace_task_comments replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.workspace_reactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_notes;
  exception when duplicate_object then null;
  end;
end $$;

update public.workspace_channels
set name = case slug
  when 'general' then 'General'
  when 'meeting-space' then 'Meeting Space'
  when 'design' then 'Design'
  else name
end
where slug in ('general', 'meeting-space', 'design');
