alter table public.workspace_notes
  add column if not exists body text not null default '',
  add column if not exists updated_at timestamptz not null default now();

grant select, insert, update, delete on public.workspace_notes to authenticated;

drop policy if exists "ws notes update" on public.workspace_notes;
create policy "ws notes update" on public.workspace_notes
  for update using (public.is_collaborator()) with check (public.is_collaborator());
