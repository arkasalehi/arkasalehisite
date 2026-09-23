alter table public.workspace_projects add column if not exists tv_kind text;
alter table public.workspace_projects add column if not exists tv_url text;
alter table public.workspace_projects add column if not exists tv_title text;
alter table public.workspace_notes add column if not exists project_id uuid references public.workspace_projects(id) on delete set null;
create index if not exists workspace_notes_project_idx on public.workspace_notes (project_id);
