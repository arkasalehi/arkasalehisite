create or replace function public.is_channel_member(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_channel_members m
    where m.channel_id = p_channel_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_channel_member(uuid) to authenticated;

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
          or public.is_channel_member(p_channel_id)
        )
    );
$$;

create or replace function public.workspace_channel_previews()
returns table (
  channel_id uuid,
  user_id uuid,
  body text,
  created_at timestamptz,
  kind text,
  file_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (m.channel_id)
    m.channel_id,
    m.user_id,
    m.body,
    m.created_at,
    m.kind::text,
    m.file_name
  from public.workspace_messages m
  order by m.channel_id, m.created_at desc
$$;

grant execute on function public.workspace_channel_previews() to authenticated;

create index if not exists workspace_messages_channel_created_idx
  on public.workspace_messages (channel_id, created_at desc);

drop policy if exists "ws channels read" on public.workspace_channels;
create policy "ws channels read" on public.workspace_channels
  for select using (
    public.is_collaborator()
    and (
      kind not in ('dm', 'private')
      or public.is_channel_member(id)
    )
  );

drop policy if exists "ws channels update" on public.workspace_channels;
create policy "ws channels update" on public.workspace_channels
  for update using (
    public.is_admin()
    or (kind not in ('dm', 'private') and public.is_collaborator())
    or public.is_channel_member(id)
  )
  with check (
    public.is_admin()
    or (kind not in ('dm', 'private') and public.is_collaborator())
    or public.is_channel_member(id)
  );

drop policy if exists "ws ch members" on public.workspace_channel_members;
drop policy if exists "ws channel members read" on public.workspace_channel_members;
drop policy if exists "ws channel members write" on public.workspace_channel_members;

create policy "ws channel members read" on public.workspace_channel_members
  for select using (public.is_collaborator() and public.is_channel_member(channel_id));

create policy "ws channel members insert" on public.workspace_channel_members
  for insert with check (
    public.is_collaborator()
    and (
      user_id = auth.uid()
      or public.is_admin()
      or public.is_channel_member(channel_id)
    )
  );

create policy "ws channel members delete" on public.workspace_channel_members
  for delete using (user_id = auth.uid() or public.is_admin());
