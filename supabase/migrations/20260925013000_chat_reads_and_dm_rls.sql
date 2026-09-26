-- Chat reads + DM/private message isolation

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
          c.kind not in ('dm', 'private')
          or exists (
            select 1
            from public.workspace_channel_members m
            where m.channel_id = c.id
              and m.user_id = auth.uid()
          )
        )
    );
$$;

grant execute on function public.can_access_channel(uuid) to authenticated;

create table if not exists public.workspace_channel_reads (
  channel_id uuid not null references public.workspace_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index if not exists workspace_channel_reads_user_idx
  on public.workspace_channel_reads (user_id, last_read_at desc);

alter table public.workspace_channel_reads enable row level security;

drop policy if exists "ws reads select" on public.workspace_channel_reads;
create policy "ws reads select" on public.workspace_channel_reads
  for select using (user_id = auth.uid());

drop policy if exists "ws reads insert" on public.workspace_channel_reads;
create policy "ws reads insert" on public.workspace_channel_reads
  for insert with check (user_id = auth.uid() and public.can_access_channel(channel_id));

drop policy if exists "ws reads update" on public.workspace_channel_reads;
create policy "ws reads update" on public.workspace_channel_reads
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.workspace_channel_reads to authenticated;

drop policy if exists "ws messages read" on public.workspace_messages;
create policy "ws messages read" on public.workspace_messages
  for select using (public.can_access_channel(channel_id));

drop policy if exists "ws messages insert" on public.workspace_messages;
create policy "ws messages insert" on public.workspace_messages
  for insert with check (user_id = auth.uid() and public.can_access_channel(channel_id));

drop policy if exists "ws messages delete own" on public.workspace_messages;
create policy "ws messages delete own" on public.workspace_messages
  for delete using (user_id = auth.uid() or public.is_admin());
