-- Realistic studio sample content (idempotent)

insert into public.workspace_projects (tenant_id, name, identifier, created_by)
select t.id, 'North Shore', 'NSH', t.created_by
from public.workspace_tenants t
where not exists (select 1 from public.workspace_projects p where p.identifier = 'NSH')
limit 1;

with src(title, status, priority, labels, description) as (
  values
    ('Lock color grade on episode 03 night market', 'doing', 'high', array['grade','episode-03']::text[], 'Final LUT should hold skin under sodium street lamps. Review with Arka before export.'),
    ('Upload camera cards from Friday rooftop', 'todo', 'urgent', array['ingest']::text[], 'A7S III cards B07–B11. Keep original filenames. Proxy at 1080p for the cut.'),
    ('Client cut notes: opening 40 seconds', 'todo', 'medium', array['edit','client']::text[], 'They want the teaser to start on the skyline, not the logo. Hold music until first footstep.'),
    ('Publish workspace trailer stills', 'done', 'low', array['site']::text[], 'Hero stills are live on the public site. Keep the same crop for the workspace card.')
)
insert into public.workspace_tasks (title, status, priority, labels, description, created_by, tenant_id, project_id)
select src.title, src.status, src.priority, src.labels, src.description, t.created_by, t.id, p.id
from src
cross join public.workspace_tenants t
join public.workspace_projects p on p.tenant_id = t.id and p.identifier = 'NSH'
where not exists (select 1 from public.workspace_tasks x where x.title = src.title);

insert into public.workspace_notes (title, color, body, created_by, tenant_id)
select
  'Dailies notes — Friday rooftop',
  'sky',
  E'# Friday rooftop\n\n- Wind on boom from 16:40. Prefer lavs for dialogue.\n- Golden hour lasted 18 minutes. Do not stretch the LUT.\n- Linked issue: camera card ingest.',
  t.created_by,
  t.id
from public.workspace_tenants t
where not exists (select 1 from public.workspace_notes n where n.title = 'Dailies notes — Friday rooftop')
limit 1;

insert into public.workspace_meetings (title, starts_at, room_name, created_by, tenant_id)
select
  'Dailies — North Shore ep.03',
  now() + interval '2 hours',
  'arka-dailies-nsh-03',
  t.created_by,
  t.id
from public.workspace_tenants t
where not exists (select 1 from public.workspace_meetings m where m.room_name = 'arka-dailies-nsh-03')
limit 1;

with msgs(body) as (
  values
    ('Cards B07–B11 are on the RAID. Proxies will be ready before dailies.'),
    ('Hold the night market shot — the practicals clip on the Alexa. I will send a still.'),
    ('@studio the client cut notes are in Tracker. Opening 40 seconds need the skyline, not the mark.')
)
insert into public.workspace_messages (channel_id, user_id, body, kind)
select c.id, t.created_by, msgs.body, 'text'
from msgs
join public.workspace_channels c on c.slug = 'general'
join public.workspace_tenants t on true
where not exists (select 1 from public.workspace_messages m where m.body = msgs.body);
